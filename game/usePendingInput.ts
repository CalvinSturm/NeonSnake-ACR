/**
 * usePendingInput
 * 
 * Collects user input from keyboard/touch and emits structured-clone-safe InputSnapshot.
 * This hook bridges the DOM input layer with the simulation.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Direction } from '../types';
import { InputSnapshot, createEmptyInput } from '../engine/simulation/types';

export interface InputCollector {
    getSnapshot(): InputSnapshot;
    setDirection(dir: Direction): void;
    setJumpIntent(intent: boolean): void;
    setBrakeIntent(intent: boolean): void;
    clear(): void;
}

export function usePendingInput(): InputCollector {
    const directionRef = useRef<Direction | null>(null);
    const jumpIntentRef = useRef(false);
    const brakeIntentRef = useRef(false);

    const getSnapshot = useCallback((): InputSnapshot => {
        return {
            direction: directionRef.current,
            jumpIntent: jumpIntentRef.current,
            brakeIntent: brakeIntentRef.current,
            frameTime: performance.now()
        };
    }, []);

    const setDirection = useCallback((dir: Direction) => {
        directionRef.current = dir;
    }, []);

    const setJumpIntent = useCallback((intent: boolean) => {
        jumpIntentRef.current = intent;
    }, []);

    const setBrakeIntent = useCallback((intent: boolean) => {
        brakeIntentRef.current = intent;
    }, []);

    const clear = useCallback(() => {
        // Don't clear direction (sticky) but clear one-shot intents
        jumpIntentRef.current = false;
    }, []);

    return {
        getSnapshot,
        setDirection,
        setJumpIntent,
        setBrakeIntent,
        clear
    };
}

/**
 * useInputSnapshot
 * 
 * Higher-level hook that automatically collects keyboard input
 * and provides a snapshot for the simulation.
 */
export function useInputSnapshot() {
    const input = usePendingInput();
    const lastDirectionRef = useRef<Direction | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    input.setDirection(Direction.UP);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    input.setDirection(Direction.DOWN);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    input.setDirection(Direction.LEFT);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    input.setDirection(Direction.RIGHT);
                    break;
                case ' ':
                    input.setJumpIntent(true);
                    break;
                case 'Shift':
                    input.setBrakeIntent(true);
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Shift':
                    input.setBrakeIntent(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [input]);

    return input;
}
