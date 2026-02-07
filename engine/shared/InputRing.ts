/**
 * InputRing
 * 
 * Lock-free SPSC (Single-Producer, Single-Consumer) ring buffer
 * for input commands from main thread to simulation worker.
 * 
 * Uses Atomics for thread-safe read/write indices.
 * 16 slots × 32 bytes = 512 bytes total.
 */

import { Direction } from '../../types';
import { directionToU8, u8ToDirection } from './BinarySnapshot';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Number of input slots in the ring buffer */
export const INPUT_RING_SIZE = 16;

/** Bytes per input slot */
export const INPUT_SLOT_SIZE = 32;

/** Total buffer size (indices + slots) */
export const INPUT_BUFFER_SIZE = 8 + (INPUT_RING_SIZE * INPUT_SLOT_SIZE); // 520 bytes

/** Buffer layout offsets */
const LAYOUT = {
    WRITE_INDEX: 0,   // u32 (atomic)
    READ_INDEX: 4,    // u32 (atomic)
    SLOTS: 8          // Start of input slots
} as const;

/** Input slot field offsets */
const SLOT = {
    DIRECTION: 0,     // u8 (255 = null)
    JUMP_INTENT: 1,   // u8 (0 or 1)
    BRAKE_INTENT: 2,  // u8 (0 or 1)
    FLAGS: 3,         // u8 (reserved)
    FRAME_TIME: 4,    // f64 (8 bytes)
    RESERVED: 12      // 20 bytes padding
} as const;

// ═══════════════════════════════════════════════════════════════
// INPUT SNAPSHOT TYPE (matches simulation/types.ts)
// ═══════════════════════════════════════════════════════════════

export interface InputSnapshot {
    direction: Direction | null;
    jumpIntent: boolean;
    brakeIntent: boolean;
    frameTime: number;
}

// ═══════════════════════════════════════════════════════════════
// INPUT RING WRITER (Main thread)
// ═══════════════════════════════════════════════════════════════

/**
 * Main-thread writer for the input ring buffer.
 * Pushes input commands to the simulation worker without postMessage.
 */
export class InputRingWriter {
    private buffer: SharedArrayBuffer;
    private u8: Uint8Array;
    private u32: Uint32Array;
    private f64: Float64Array;
    private i32: Int32Array; // For Atomics

    constructor(buffer: SharedArrayBuffer) {
        if (buffer.byteLength < INPUT_BUFFER_SIZE) {
            throw new Error(`Input buffer too small: ${buffer.byteLength} < ${INPUT_BUFFER_SIZE}`);
        }

        this.buffer = buffer;
        this.u8 = new Uint8Array(buffer);
        this.u32 = new Uint32Array(buffer);
        this.f64 = new Float64Array(buffer);
        this.i32 = new Int32Array(buffer);
    }

    /**
     * Push an input snapshot to the ring buffer.
     * Returns true if the input was written, false if buffer is full.
     */
    push(input: InputSnapshot): boolean {
        // Load current indices atomically
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);

        // Check if buffer is full
        const nextWrite = (writeIndex + 1) % INPUT_RING_SIZE;
        if (nextWrite === readIndex) {
            // Buffer is full - drop oldest input
            console.warn('[InputRing] Buffer full, overwriting oldest');
            // Advance read index to make room
            Atomics.store(this.i32, LAYOUT.READ_INDEX / 4, (readIndex + 1) % INPUT_RING_SIZE);
        }

        // Calculate slot offset
        const slotBase = LAYOUT.SLOTS + (writeIndex * INPUT_SLOT_SIZE);

        // Write input data
        this.u8[slotBase + SLOT.DIRECTION] = input.direction !== null
            ? directionToU8(input.direction)
            : 255;
        this.u8[slotBase + SLOT.JUMP_INTENT] = input.jumpIntent ? 1 : 0;
        this.u8[slotBase + SLOT.BRAKE_INTENT] = input.brakeIntent ? 1 : 0;
        this.u8[slotBase + SLOT.FLAGS] = 0;

        // Write frame time (f64 needs alignment consideration)
        // Using DataView for safe unaligned access
        const dv = new DataView(this.buffer, slotBase + SLOT.FRAME_TIME, 8);
        dv.setFloat64(0, input.frameTime, true); // little-endian

        // Advance write index atomically
        Atomics.store(this.i32, LAYOUT.WRITE_INDEX / 4, nextWrite);

        return true;
    }

    /**
     * Get the number of pending inputs in the buffer.
     */
    getPendingCount(): number {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);

        if (writeIndex >= readIndex) {
            return writeIndex - readIndex;
        }
        return INPUT_RING_SIZE - readIndex + writeIndex;
    }

    /**
     * Clear all pending inputs.
     */
    clear(): void {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        Atomics.store(this.i32, LAYOUT.READ_INDEX / 4, writeIndex);
    }
}

// ═══════════════════════════════════════════════════════════════
// INPUT RING READER (Worker)
// ═══════════════════════════════════════════════════════════════

/**
 * Worker-side reader for the input ring buffer.
 * Consumes input commands from the main thread.
 */
export class InputRingReader {
    private buffer: SharedArrayBuffer;
    private u8: Uint8Array;
    private i32: Int32Array;

    constructor(buffer: SharedArrayBuffer) {
        if (buffer.byteLength < INPUT_BUFFER_SIZE) {
            throw new Error(`Input buffer too small: ${buffer.byteLength} < ${INPUT_BUFFER_SIZE}`);
        }

        this.buffer = buffer;
        this.u8 = new Uint8Array(buffer);
        this.i32 = new Int32Array(buffer);
    }

    /**
     * Check if there are pending inputs to read.
     */
    hasInput(): boolean {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);
        return writeIndex !== readIndex;
    }

    /**
     * Pop the next input from the buffer.
     * Returns null if no input available.
     */
    pop(): InputSnapshot | null {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);

        // Check if buffer is empty
        if (readIndex === writeIndex) {
            return null;
        }

        // Calculate slot offset
        const slotBase = LAYOUT.SLOTS + (readIndex * INPUT_SLOT_SIZE);

        // Read input data
        const dirByte = this.u8[slotBase + SLOT.DIRECTION];
        const direction = dirByte === 255 ? null : u8ToDirection(dirByte);
        const jumpIntent = this.u8[slotBase + SLOT.JUMP_INTENT] === 1;
        const brakeIntent = this.u8[slotBase + SLOT.BRAKE_INTENT] === 1;

        // Read frame time
        const dv = new DataView(this.buffer, slotBase + SLOT.FRAME_TIME, 8);
        const frameTime = dv.getFloat64(0, true);

        // Advance read index atomically
        const nextRead = (readIndex + 1) % INPUT_RING_SIZE;
        Atomics.store(this.i32, LAYOUT.READ_INDEX / 4, nextRead);

        return {
            direction,
            jumpIntent,
            brakeIntent,
            frameTime
        };
    }

    /**
     * Peek at the next input without consuming it.
     */
    peek(): InputSnapshot | null {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);

        if (readIndex === writeIndex) {
            return null;
        }

        const slotBase = LAYOUT.SLOTS + (readIndex * INPUT_SLOT_SIZE);

        const dirByte = this.u8[slotBase + SLOT.DIRECTION];
        const direction = dirByte === 255 ? null : u8ToDirection(dirByte);
        const jumpIntent = this.u8[slotBase + SLOT.JUMP_INTENT] === 1;
        const brakeIntent = this.u8[slotBase + SLOT.BRAKE_INTENT] === 1;

        const dv = new DataView(this.buffer, slotBase + SLOT.FRAME_TIME, 8);
        const frameTime = dv.getFloat64(0, true);

        return {
            direction,
            jumpIntent,
            brakeIntent,
            frameTime
        };
    }

    /**
     * Consume all pending inputs and return the most recent one.
     * Useful when you only care about the latest input state.
     */
    consumeLatest(): InputSnapshot | null {
        let latest: InputSnapshot | null = null;
        let input: InputSnapshot | null;

        while ((input = this.pop()) !== null) {
            latest = input;
        }

        return latest;
    }

    /**
     * Get the number of pending inputs.
     */
    getPendingCount(): number {
        const writeIndex = Atomics.load(this.i32, LAYOUT.WRITE_INDEX / 4);
        const readIndex = Atomics.load(this.i32, LAYOUT.READ_INDEX / 4);

        if (writeIndex >= readIndex) {
            return writeIndex - readIndex;
        }
        return INPUT_RING_SIZE - readIndex + writeIndex;
    }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Create a SharedArrayBuffer for the input ring.
 */
export function createInputBuffer(): SharedArrayBuffer {
    return new SharedArrayBuffer(INPUT_BUFFER_SIZE);
}
