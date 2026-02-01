
import { Enemy, EnemyIntent } from '../../types';

export interface AIContext {
    dt: number;
    playerPos: { x: number; y: number };
    aggressionMod: number; // From Difficulty
    bossActive: boolean;
    bossPhase: number;
}

export type { Enemy, EnemyIntent };
