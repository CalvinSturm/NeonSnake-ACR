
import { BossConfig, BossStateTable, HitboxDef } from '../types';

const HITBOX_BREACH_BEAM: HitboxDef = {
    tag: 'BREACH_BEAM',
    width: 25,   // Very Wide
    height: 4,  
    offsetX: -15, // Fires left
    offsetY: 0, 
    damage: 9999, // Massive damage to barrier
    color: '#ff00ff'
};

const HITBOX_SUPPRESSION: HitboxDef = {
    tag: 'SUPPRESSION_FIRE',
    width: 1,
    height: 1,
    offsetX: -2,
    offsetY: 0,
    damage: 20,
    color: '#ffff00'
};

const PHASE_1: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: 2000,
        next: 'CHARGE_CANNON',
    },
    'CHARGE_CANNON': {
        id: 'CHARGE_CANNON',
        duration: 2500, // Long telegraph
        next: 'FIRE_CANNON',
    },
    'FIRE_CANNON': {
        id: 'FIRE_CANNON',
        duration: 1000,
        next: 'COOLDOWN',
        onEnter: [{ type: 'SPAWN_HITBOX', hitboxDef: HITBOX_BREACH_BEAM }]
    },
    'COOLDOWN': {
        id: 'COOLDOWN',
        duration: 2000,
        next: 'IDLE',
        onExit: [{ type: 'DESPAWN_HITBOX', tag: 'BREACH_BEAM' }]
    }
};

export const SPACESHIP_BOSS_CONFIG: BossConfig = {
    id: 'SPACESHIP_BOSS',
    name: 'INTERCEPTOR CAPITAL',
    phases: [
        {
            threshold: 1.0,
            table: PHASE_1,
            entryState: 'IDLE'
        }
    ]
};
