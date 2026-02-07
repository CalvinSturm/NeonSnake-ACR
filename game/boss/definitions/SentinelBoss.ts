
import { BossConfig, BossStateTable, HitboxDef, BossIntent } from '../types';
import { EnemyType } from '../../../types';
import { SENTINEL_BOSS } from '../../enemies/enemyConstants';

const P1 = SENTINEL_BOSS.PHASE1;
const P2 = SENTINEL_BOSS.PHASE2;

const HITBOX_SLAM: HitboxDef = {
    tag: 'SLAM_ZONE',
    width: P1.SLAM_HITBOX_WIDTH,
    height: P1.SLAM_HITBOX_HEIGHT,
    offsetX: 0,
    offsetY: 2,
    damage: P1.SLAM_DAMAGE,
    color: 'rgba(255, 0, 0, 0.6)'
};

const PHASE_1_TABLE: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: P1.IDLE_DURATION,
        next: 'TELEGRAPH_SCATTER',
        onEnter: []
    },
    'TELEGRAPH_SCATTER': {
        id: 'TELEGRAPH_SCATTER',
        duration: P1.SCATTER_TELEGRAPH_DURATION,
        next: 'FIRE_SCATTER',
        onEnter: []
    },
    'FIRE_SCATTER': {
        id: 'FIRE_SCATTER',
        duration: P1.SCATTER_FIRE_DURATION,
        next: 'TELEGRAPH_SLAM',
        onEnter: [
            {
                type: 'SPAWN_PROJECTILE',
                angle: 0,
                speed: P1.SCATTER_PROJECTILE_SPEED,
                damage: P1.SCATTER_PROJECTILE_DAMAGE,
                count: P1.SCATTER_PROJECTILE_COUNT,
                spread: P1.SCATTER_SPREAD,
                targetPlayer: true
            }
        ]
    },
    'TELEGRAPH_SLAM': {
        id: 'TELEGRAPH_SLAM',
        duration: P1.SLAM_TELEGRAPH_DURATION,
        next: 'EXECUTE_SLAM',
        onEnter: []
    },
    'EXECUTE_SLAM': {
        id: 'EXECUTE_SLAM',
        duration: P1.SLAM_EXECUTE_DURATION,
        next: 'RECOVERY',
        onEnter: [
            { type: 'SPAWN_HITBOX', hitboxDef: HITBOX_SLAM }
        ]
    },
    'RECOVERY': {
        id: 'RECOVERY',
        duration: P1.SLAM_RECOVERY_DURATION,
        next: 'IDLE',
        onExit: [
            { type: 'DESPAWN_HITBOX', tag: 'SLAM_ZONE' }
        ]
    }
};

const HITBOX_WIDE: HitboxDef = {
    tag: 'WIDE_ZONE',
    width: P2.WIDE_HITBOX_WIDTH,
    height: P2.WIDE_HITBOX_HEIGHT,
    offsetX: 0,
    offsetY: 3,
    damage: P2.WIDE_DAMAGE,
    color: 'rgba(255, 50, 0, 0.7)'
};

const PHASE_2_TABLE: BossStateTable = {
    'IDLE': {
        id: 'IDLE',
        duration: P2.IDLE_DURATION,
        next: 'TELEGRAPH_WIDE',
        onEnter: [
            {
                type: 'SPAWN_MINIONS',
                enemyType: EnemyType.HUNTER,
                count: P2.MINION_SPAWN_COUNT,
                offset: { x: P2.MINION_OFFSET_X, y: P2.MINION_OFFSET_Y }
            }
        ]
    },
    'TELEGRAPH_WIDE': {
        id: 'TELEGRAPH_WIDE',
        duration: P2.WIDE_TELEGRAPH_DURATION,
        next: 'EXECUTE_WIDE',
        onEnter: []
    },
    'EXECUTE_WIDE': {
        id: 'EXECUTE_WIDE',
        duration: P2.WIDE_EXECUTE_DURATION,
        next: 'BARRAGE',
        onEnter: [
            { type: 'SPAWN_HITBOX', hitboxDef: HITBOX_WIDE },
            { type: 'APPLY_EFFECT', effect: 'SLOW', duration: P2.SLOW_EFFECT_DURATION }
        ]
    },
    'BARRAGE': {
        id: 'BARRAGE',
        duration: P2.BARRAGE_DURATION,
        next: 'RECOVERY',
        onEnter: [
            {
                type: 'SPAWN_PROJECTILE',
                angle: 0,
                speed: P2.BARRAGE_PROJECTILE_SPEED,
                damage: P2.BARRAGE_PROJECTILE_DAMAGE,
                count: P2.BARRAGE_PROJECTILE_COUNT,
                spread: P2.BARRAGE_SPREAD
            }
        ],
        onExit: [
            { type: 'DESPAWN_HITBOX', tag: 'WIDE_ZONE' }
        ]
    },
    'RECOVERY': {
        id: 'RECOVERY',
        duration: P2.RECOVERY_DURATION,
        next: 'IDLE'
    }
};

export const SENTINEL_BOSS_CONFIG: BossConfig = {
    id: 'SENTINEL',
    name: 'SENTINEL MK.1',
    phases: [
        {
            threshold: 1.0,
            table: PHASE_1_TABLE,
            entryState: 'IDLE'
        },
        {
            threshold: 0.5,
            table: PHASE_2_TABLE,
            entryState: 'IDLE'
        }
    ]
};
