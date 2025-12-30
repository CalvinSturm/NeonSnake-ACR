
import { BossConfig, BossStateTable, HitboxDef } from '../types';

const HITBOX_OVERHEAD: HitboxDef = {
    tag: 'OVERHEAD_SLAM',
    width: 2,   // Narrow
    height: 6,  // Tall
    offsetX: 3, // Forward reach
    offsetY: 0,
    damage: 35,
    color: '#ff0000'
};

const HITBOX_SWEEP: HitboxDef = {
    tag: 'SWEEP_SLASH',
    width: 6,   // Wide
    height: 1.5, // Low
    offsetX: 0, // Centered/Forward sweep
    offsetY: 2, // Floor level
    damage: 25,
    color: '#ff4400'
};

// ─── PHASE 1 (Standard Timing) ───
const PHASE_1: BossStateTable = {
    // SEQUENCE 1: OVERHEAD
    'IDLE_1': {
        id: 'IDLE_1',
        duration: 1000,
        next: 'TELEGRAPH_OVERHEAD'
    },
    'TELEGRAPH_OVERHEAD': {
        id: 'TELEGRAPH_OVERHEAD',
        duration: 700,
        next: 'EXECUTE_OVERHEAD'
    },
    'EXECUTE_OVERHEAD': {
        id: 'EXECUTE_OVERHEAD',
        duration: 250,
        next: 'RECOVERY_OVERHEAD',
        onEnter: [{ type: 'SPAWN_HITBOX', hitboxDef: HITBOX_OVERHEAD }]
    },
    'RECOVERY_OVERHEAD': {
        id: 'RECOVERY_OVERHEAD',
        duration: 900,
        next: 'IDLE_2',
        onExit: [{ type: 'DESPAWN_HITBOX', tag: 'OVERHEAD_SLAM' }]
    },

    // SEQUENCE 2: SWEEP
    'IDLE_2': {
        id: 'IDLE_2',
        duration: 1000,
        next: 'TELEGRAPH_SWEEP'
    },
    'TELEGRAPH_SWEEP': {
        id: 'TELEGRAPH_SWEEP',
        duration: 600,
        next: 'EXECUTE_SWEEP'
    },
    'EXECUTE_SWEEP': {
        id: 'EXECUTE_SWEEP',
        duration: 300,
        next: 'RECOVERY_SWEEP',
        onEnter: [{ type: 'SPAWN_HITBOX', hitboxDef: HITBOX_SWEEP }]
    },
    'RECOVERY_SWEEP': {
        id: 'RECOVERY_SWEEP',
        duration: 700,
        next: 'IDLE_1',
        onExit: [{ type: 'DESPAWN_HITBOX', tag: 'SWEEP_SLASH' }]
    }
};

// ─── PHASE 2 (Aggressive: Faster Idle/Recovery) ───
const PHASE_2: BossStateTable = {
    // SEQUENCE 1: OVERHEAD
    'IDLE_1': {
        id: 'IDLE_1',
        duration: 600, // Reduced
        next: 'TELEGRAPH_OVERHEAD'
    },
    'TELEGRAPH_OVERHEAD': {
        id: 'TELEGRAPH_OVERHEAD',
        duration: 700,
        next: 'EXECUTE_OVERHEAD'
    },
    'EXECUTE_OVERHEAD': {
        id: 'EXECUTE_OVERHEAD',
        duration: 250,
        next: 'RECOVERY_OVERHEAD',
        onEnter: [{ type: 'SPAWN_HITBOX', hitboxDef: { ...HITBOX_OVERHEAD, damage: 40 } }] // +Damage
    },
    'RECOVERY_OVERHEAD': {
        id: 'RECOVERY_OVERHEAD',
        duration: 600, // Reduced
        next: 'IDLE_2',
        onExit: [{ type: 'DESPAWN_HITBOX', tag: 'OVERHEAD_SLAM' }]
    },

    // SEQUENCE 2: SWEEP
    'IDLE_2': {
        id: 'IDLE_2',
        duration: 600, // Reduced
        next: 'TELEGRAPH_SWEEP'
    },
    'TELEGRAPH_SWEEP': {
        id: 'TELEGRAPH_SWEEP',
        duration: 600,
        next: 'EXECUTE_SWEEP'
    },
    'EXECUTE_SWEEP': {
        id: 'EXECUTE_SWEEP',
        duration: 300,
        next: 'RECOVERY_SWEEP',
        onEnter: [{ type: 'SPAWN_HITBOX', hitboxDef: { ...HITBOX_SWEEP, damage: 30 } }] // +Damage
    },
    'RECOVERY_SWEEP': {
        id: 'RECOVERY_SWEEP',
        duration: 600, // Reduced
        next: 'IDLE_1',
        onExit: [{ type: 'DESPAWN_HITBOX', tag: 'SWEEP_SLASH' }]
    }
};

export const WARDEN_BOSS_CONFIG: BossConfig = {
    id: 'WARDEN_07',
    name: 'WARDEN-07',
    phases: [
        {
            threshold: 1.0,
            table: PHASE_1,
            entryState: 'IDLE_1'
        },
        {
            threshold: 0.5,
            table: PHASE_2,
            entryState: 'IDLE_1'
        }
    ]
};
