
// ═══════════════════════════════════════════════════════════════════════════
// ENEMY & BOSS TUNING CONSTANTS
// All values in one place for easy balancing
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// HUNTER (Basic enemy - simple chase behavior)
// ─────────────────────────────────────────────────────────────────────────────
export const HUNTER = {
    ACCELERATION: 0.5,          // How quickly it accelerates toward player
    FRICTION: 0.92,             // Velocity decay (lower = more slidey)
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERCEPTOR (Dive bomber - makes attack passes at player)
// ─────────────────────────────────────────────────────────────────────────────
export const INTERCEPTOR = {
    // Distance thresholds (grid units)
    STALK_DISTANCE: 10,         // Distance to maintain while stalking
    DIVE_TRIGGER_DISTANCE: 15,  // Max distance to initiate a dive

    // Timing (ms) - scaled by difficulty aggressionMod
    STALK_DURATION: 1500,       // Time spent stalking before diving
    DIVE_DURATION: 400,         // How long the dive lasts
    PASS_DURATION: 300,         // Time spent coasting after dive
    RETREAT_DURATION: 1000,     // Max time spent retreating

    // Movement speeds
    ENTER_SPEED: 0.8,           // Speed multiplier when entering play area
    STALK_SPEED: 0.4,           // Speed multiplier while stalking
    DIVE_SPEED: 15,             // Velocity during dive (grid units/sec)
    RETREAT_SPEED: 0.5,         // Speed multiplier while retreating
    PASS_FRICTION: 0.92,        // Velocity decay during pass-through
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOOTER (Ranged attacker)
// ─────────────────────────────────────────────────────────────────────────────
export const SHOOTER = {
    // Range thresholds (grid units)
    RANGE_MIN: 8,               // Too close - back off
    RANGE_MAX: 16,              // Too far - approach

    // Timing (ms) - scaled by difficulty aggressionMod
    PATROL_ENGAGE_TIME: 1000,   // Time in sweet spot before charging
    CHARGE_TIME: 1500,          // Time to charge up shot
    FIRE_TIME: 500,             // Time in fire state (animation)
    REPOSITION_TIME: 2000,      // Time spent repositioning after shot

    // Projectile stats
    PROJECTILE_SPEED_MULT: 0.6, // Multiplier of base PROJECTILE_SPEED
    PROJECTILE_DAMAGE: 15,
    PROJECTILE_SIZE: 6,
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHER (High-speed charger)
// ─────────────────────────────────────────────────────────────────────────────
export const DASHER = {
    // Distance threshold (grid units)
    CHARGE_TRIGGER_DISTANCE: 10, // Distance to player that triggers charge-up

    // Timing (ms) - scaled by difficulty aggressionMod
    CHARGE_DURATION: 800,       // Wind-up time before dash
    DASH_DURATION: 400,         // How long the dash lasts
    COOLDOWN_DURATION: 1500,    // Vulnerable recovery time after dash

    // Speed
    MAX_DASH_SPEED: 600,        // Maximum velocity during dash (px/s)

    // Boss modifier (when boss is active, dasher is more aggressive)
    BOSS_ACTIVE_MODIFIER: 0.7,  // Multiplier for charge/cooldown times
};

// ─────────────────────────────────────────────────────────────────────────────
// SENTINEL BOSS (Stage 5)
// ─────────────────────────────────────────────────────────────────────────────
export const SENTINEL_BOSS = {
    // ── PHASE 1 (100% - 50% HP) ──
    PHASE1: {
        IDLE_DURATION: 1500,

        // Scatter Shot Attack
        SCATTER_TELEGRAPH_DURATION: 600,
        SCATTER_FIRE_DURATION: 300,
        SCATTER_PROJECTILE_COUNT: 3,
        SCATTER_PROJECTILE_SPEED: 12,
        SCATTER_PROJECTILE_DAMAGE: 15,
        SCATTER_SPREAD: 0.5,        // Radians (~29 degrees total)

        // Slam Attack
        SLAM_TELEGRAPH_DURATION: 800,
        SLAM_EXECUTE_DURATION: 300,
        SLAM_RECOVERY_DURATION: 1200,
        SLAM_HITBOX_WIDTH: 6,
        SLAM_HITBOX_HEIGHT: 4,
        SLAM_DAMAGE: 30,
    },

    // ── PHASE 2 (50% - 0% HP) ──
    PHASE2: {
        IDLE_DURATION: 800,
        MINION_SPAWN_COUNT: 1,
        MINION_OFFSET_X: 5,
        MINION_OFFSET_Y: 5,

        // Wide Slam Attack
        WIDE_TELEGRAPH_DURATION: 500,
        WIDE_EXECUTE_DURATION: 400,
        WIDE_HITBOX_WIDTH: 12,
        WIDE_HITBOX_HEIGHT: 3,
        WIDE_DAMAGE: 40,
        SLOW_EFFECT_DURATION: 2000,

        // Barrage Attack
        BARRAGE_DURATION: 600,
        BARRAGE_PROJECTILE_COUNT: 8,
        BARRAGE_PROJECTILE_SPEED: 20,
        BARRAGE_PROJECTILE_DAMAGE: 20,
        BARRAGE_SPREAD: Math.PI * 2, // Full circle

        RECOVERY_DURATION: 800,
    },

    // ── MOVEMENT ──
    HOVER_HEIGHT: 5,            // Grid units from top
    TRACKING_SPEED: 1.5,        // How fast it tracks player X
    BOB_AMPLITUDE: 1.5,         // Vertical bobbing amount
    BOB_FREQUENCY: 500,         // Bobbing speed (ms per cycle)
    SLAM_GRAVITY: 80,           // Downward acceleration during slam
    RISE_SPEED: 1.0,            // How fast it rises after slam
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ENEMY SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export const ENEMY_SHARED = {
    // Spawn animation
    SPAWN_INVULNERABILITY_TIME: 500, // ms of invuln after spawn
    ENTER_MARGIN: 0.5,          // Grid units inside bounds to become ACTIVE

    // Visual
    HIT_FLASH_DURATION: 5,      // Frames of white flash when hit
};
