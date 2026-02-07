/**
 * Quality Configuration
 *
 * Configurable thresholds for dynamic quality scaling.
 * Prioritizes reducing visual effects over gameplay fidelity.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type QualityLevel = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'POTATO';

export interface QualityThresholds {
    /** FPS below this triggers downgrade evaluation */
    downgradeFps: number;
    /** FPS above this triggers upgrade evaluation */
    upgradeFps: number;
    /** Consecutive frames below threshold before downgrade */
    downgradeFrames: number;
    /** Consecutive frames above threshold before upgrade */
    upgradeFrames: number;
    /** Maximum frame time (ms) before emergency downgrade */
    emergencyFrameTimeMs: number;
}

export interface QualitySettings {
    // Visual Effects (reduced first)
    particleLimit: number;
    particleComplexity: number;      // 0-1, affects particle size/glow
    shaderQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';
    bloomEnabled: boolean;
    chromaticEnabled: boolean;
    crtEnabled: boolean;
    scanlineIntensity: number;       // 0-1

    // Rendering (reduced second)
    shadowBlurRadius: number;        // 0-20
    glowIntensity: number;           // 0-1
    trailLength: number;             // Snake trail segments

    // Gameplay-adjacent (reduced last, carefully)
    enemyAnimationDetail: number;    // 0-1, affects animation smoothness
    projectileTrails: boolean;
    screenShakeIntensity: number;    // 0-1
}

export interface QualityPreset {
    level: QualityLevel;
    label: string;
    settings: QualitySettings;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT THRESHOLDS (Configurable)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
    downgradeFps: 45,
    upgradeFps: 58,
    downgradeFrames: 30,      // ~0.5 seconds at 60fps
    upgradeFrames: 120,       // ~2 seconds at 60fps
    emergencyFrameTimeMs: 50, // 20fps or worse = emergency
};

// ═══════════════════════════════════════════════════════════════
// QUALITY PRESETS
// ═══════════════════════════════════════════════════════════════

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
    ULTRA: {
        level: 'ULTRA',
        label: 'Ultra',
        settings: {
            particleLimit: 300,
            particleComplexity: 1.0,
            shaderQuality: 'HIGH',
            bloomEnabled: true,
            chromaticEnabled: true,
            crtEnabled: true,
            scanlineIntensity: 0.15,
            shadowBlurRadius: 20,
            glowIntensity: 1.0,
            trailLength: 10,
            enemyAnimationDetail: 1.0,
            projectileTrails: true,
            screenShakeIntensity: 1.0,
        },
    },
    HIGH: {
        level: 'HIGH',
        label: 'High',
        settings: {
            particleLimit: 200,
            particleComplexity: 0.8,
            shaderQuality: 'HIGH',
            bloomEnabled: true,
            chromaticEnabled: true,
            crtEnabled: true,
            scanlineIntensity: 0.12,
            shadowBlurRadius: 15,
            glowIntensity: 0.8,
            trailLength: 8,
            enemyAnimationDetail: 1.0,
            projectileTrails: true,
            screenShakeIntensity: 1.0,
        },
    },
    MEDIUM: {
        level: 'MEDIUM',
        label: 'Medium',
        settings: {
            particleLimit: 150,
            particleComplexity: 0.6,
            shaderQuality: 'MEDIUM',
            bloomEnabled: true,
            chromaticEnabled: false,
            crtEnabled: true,
            scanlineIntensity: 0.1,
            shadowBlurRadius: 10,
            glowIntensity: 0.6,
            trailLength: 6,
            enemyAnimationDetail: 0.8,
            projectileTrails: true,
            screenShakeIntensity: 0.8,
        },
    },
    LOW: {
        level: 'LOW',
        label: 'Low',
        settings: {
            particleLimit: 80,
            particleComplexity: 0.4,
            shaderQuality: 'LOW',
            bloomEnabled: false,
            chromaticEnabled: false,
            crtEnabled: false,
            scanlineIntensity: 0.05,
            shadowBlurRadius: 5,
            glowIntensity: 0.3,
            trailLength: 4,
            enemyAnimationDetail: 0.6,
            projectileTrails: false,
            screenShakeIntensity: 0.5,
        },
    },
    POTATO: {
        level: 'POTATO',
        label: 'Potato',
        settings: {
            particleLimit: 30,
            particleComplexity: 0.2,
            shaderQuality: 'OFF',
            bloomEnabled: false,
            chromaticEnabled: false,
            crtEnabled: false,
            scanlineIntensity: 0,
            shadowBlurRadius: 0,
            glowIntensity: 0,
            trailLength: 2,
            enemyAnimationDetail: 0.4,
            projectileTrails: false,
            screenShakeIntensity: 0.3,
        },
    },
};

// ═══════════════════════════════════════════════════════════════
// QUALITY LEVEL ORDER (for scaling)
// ═══════════════════════════════════════════════════════════════

export const QUALITY_LEVELS: QualityLevel[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'POTATO'];

/**
 * Get the next lower quality level.
 */
export function getNextLowerQuality(current: QualityLevel): QualityLevel | null {
    const index = QUALITY_LEVELS.indexOf(current);
    if (index < QUALITY_LEVELS.length - 1) {
        return QUALITY_LEVELS[index + 1];
    }
    return null;
}

/**
 * Get the next higher quality level.
 */
export function getNextHigherQuality(current: QualityLevel): QualityLevel | null {
    const index = QUALITY_LEVELS.indexOf(current);
    if (index > 0) {
        return QUALITY_LEVELS[index - 1];
    }
    return null;
}

/**
 * Get quality settings for a level.
 */
export function getQualitySettings(level: QualityLevel): QualitySettings {
    return { ...QUALITY_PRESETS[level].settings };
}

/**
 * Interpolate between two quality levels (for smooth transitions).
 */
export function interpolateQuality(
    from: QualitySettings,
    to: QualitySettings,
    t: number
): QualitySettings {
    const lerp = (a: number, b: number) => a + (b - a) * t;

    return {
        particleLimit: Math.round(lerp(from.particleLimit, to.particleLimit)),
        particleComplexity: lerp(from.particleComplexity, to.particleComplexity),
        shaderQuality: t < 0.5 ? from.shaderQuality : to.shaderQuality,
        bloomEnabled: t < 0.5 ? from.bloomEnabled : to.bloomEnabled,
        chromaticEnabled: t < 0.5 ? from.chromaticEnabled : to.chromaticEnabled,
        crtEnabled: t < 0.5 ? from.crtEnabled : to.crtEnabled,
        scanlineIntensity: lerp(from.scanlineIntensity, to.scanlineIntensity),
        shadowBlurRadius: lerp(from.shadowBlurRadius, to.shadowBlurRadius),
        glowIntensity: lerp(from.glowIntensity, to.glowIntensity),
        trailLength: Math.round(lerp(from.trailLength, to.trailLength)),
        enemyAnimationDetail: lerp(from.enemyAnimationDetail, to.enemyAnimationDetail),
        projectileTrails: t < 0.5 ? from.projectileTrails : to.projectileTrails,
        screenShakeIntensity: lerp(from.screenShakeIntensity, to.screenShakeIntensity),
    };
}
