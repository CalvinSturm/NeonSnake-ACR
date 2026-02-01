
import { BossConfig, BossStateTable, HitboxDef } from '../types';

// NOTE: Beam collision is handled dynamically in useCollisions.ts to support rotation
// We only define suppression fire hitboxes here if needed, but for now we rely on projectiles/beams.

const PHASE_1: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: 1500,
        next: 'CHARGE_CANNON',
    },
    'CHARGE_CANNON': {
        id: 'CHARGE_CANNON',
        duration: 1000, // Faster charge
        next: 'FIRE_CANNON',
    },
    'FIRE_CANNON': {
        id: 'FIRE_CANNON',
        duration: 800, // Shorter fire duration
        next: 'COOLDOWN',
        onEnter: [
            // Spawn a spread of projectiles aimed downward - faster and more dangerous
            { type: 'SPAWN_PROJECTILE', angle: Math.PI / 2, speed: 25, damage: 25, count: 7, spread: 1.2 }
        ]
    },
    'COOLDOWN': {
        id: 'COOLDOWN',
        duration: 1200, // Shorter cooldown
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
