
import { BossConfig, BossStateTable } from '../types';

const HITBOX_SLAM: any = {
    tag: 'SLAM_ZONE',
    width: 6,
    height: 4,
    offsetX: 0,
    offsetY: 2, // Below boss
    damage: 30,
    color: 'rgba(255, 0, 0, 0.6)'
};

const PHASE_1_TABLE: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: 1500,
        next: 'TELEGRAPH_SLAM',
        onEnter: []
    },
    'TELEGRAPH_SLAM': {
        id: 'TELEGRAPH_SLAM',
        duration: 800,
        next: 'EXECUTE_SLAM',
        onEnter: [] // Visuals handled by renderer checking stateId
    },
    'EXECUTE_SLAM': {
        id: 'EXECUTE_SLAM',
        duration: 300,
        next: 'RECOVERY',
        onEnter: [
            { type: 'SPAWN_HITBOX', hitboxDef: HITBOX_SLAM }
        ]
    },
    'RECOVERY': {
        id: 'RECOVERY',
        duration: 1200,
        next: 'IDLE',
        onExit: [
            { type: 'DESPAWN_HITBOX', tag: 'SLAM_ZONE' }
        ]
    }
};

const HITBOX_WIDE: any = {
    tag: 'WIDE_ZONE',
    width: 12,
    height: 3,
    offsetX: 0,
    offsetY: 3,
    damage: 40,
    color: 'rgba(255, 50, 0, 0.7)'
};

const PHASE_2_TABLE: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: 1000, // Faster
        next: 'TELEGRAPH_WIDE',
        onEnter: []
    },
    'TELEGRAPH_WIDE': {
        id: 'TELEGRAPH_WIDE',
        duration: 600,
        next: 'EXECUTE_WIDE',
        onEnter: []
    },
    'EXECUTE_WIDE': {
        id: 'EXECUTE_WIDE',
        duration: 400,
        next: 'RECOVERY',
        onEnter: [
            { type: 'SPAWN_HITBOX', hitboxDef: HITBOX_WIDE }
        ]
    },
    'RECOVERY': {
        id: 'RECOVERY',
        duration: 1000,
        next: 'IDLE',
        onExit: [
            { type: 'DESPAWN_HITBOX', tag: 'WIDE_ZONE' }
        ]
    }
};

export const SENTINEL_BOSS_CONFIG: BossConfig = {
    id: 'SENTINEL',
    name: 'SENTINEL MK.1',
    phases: [
        {
            threshold: 1.0, // Start here
            table: PHASE_1_TABLE,
            entryState: 'IDLE'
        },
        {
            threshold: 0.5, // 50% HP
            table: PHASE_2_TABLE,
            entryState: 'IDLE'
        }
    ]
};
