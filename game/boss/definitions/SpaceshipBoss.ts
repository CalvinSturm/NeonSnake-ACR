
import { BossConfig, BossStateTable, HitboxDef } from '../types';

// NOTE: Beam collision is handled dynamically in useCollisions.ts to support rotation
// We only define suppression fire hitboxes here if needed, but for now we rely on projectiles/beams.

const PHASE_1: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: 2000,
        next: 'CHARGE_CANNON',
    },
    'CHARGE_CANNON': {
        id: 'CHARGE_CANNON',
        duration: 1500, // Reduced slightly for better pacing
        next: 'FIRE_CANNON',
    },
    'FIRE_CANNON': {
        id: 'FIRE_CANNON',
        duration: 1200, // Duration of the lethal beam
        next: 'COOLDOWN',
        onEnter: [] // Collision handled via state check
    },
    'COOLDOWN': {
        id: 'COOLDOWN',
        duration: 2000,
        next: 'IDLE'
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
