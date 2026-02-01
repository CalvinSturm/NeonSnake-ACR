
import { RenderContext } from './types';
import { useGameState } from '../useGameState';
import { DEFAULT_SETTINGS, HUD_TOP_HEIGHT, PLAY_AREA_HEIGHT, COLORS } from '../../constants';
import { renderBackground } from './passes/renderBackground';
import { renderEnvironment } from './passes/renderEnvironment';
import { renderEntities } from './passes/renderEntities';
import { renderProjectiles } from './passes/renderProjectiles';
import { renderFX } from './passes/renderFX';
import { renderUI } from './passes/renderUI';
import { renderFloor } from './floor/FloorRenderer';
import { CameraMode, GameStatus } from '../../types';
import { renderDebug } from './passes/renderDebug';

export const renderFrame = (
    ctx: CanvasRenderingContext2D,
    game: ReturnType<typeof useGameState>,
    width: number,
    height: number,
    moveProgress: number,
    uiStyle?: any
) => {
    // 1. Setup Context
    const now = performance.now();
    const gridSize = DEFAULT_SETTINGS.gridSize;
    const camera = game.cameraRef.current;

    // Identify Boss
    const boss = game.bossEnemyRef.current;

    const rc: RenderContext = {
        ctx,
        now,
        gameTime: game.gameTimeRef.current,
        width,
        height,
        gridSize,
        halfGrid: gridSize / 2,
        stageReady: game.stageReadyRef.current,
        stageReadyTime: game.stageReadyTimeRef.current,
        uiStyle,
        snakeStyle: game.settings.snakeStyle,
        camera,
        isStopped: game.isStoppedRef.current,
        stage: game.stageRef.current,
        bossActive: game.bossActiveRef.current,
        bossConfigId: boss?.bossConfigId,
        status: game.status,
        viewport: game.viewport
    };

    // 2. Global Clear (Black base)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020202';
    ctx.fillRect(0, 0, width, height);

    // 3. BACKGROUND LAYER (Global, Parallax, Theme-aware)
    // Renders behind the HUD to create depth
    renderBackground(rc);

    // 4. PLAY AREA (Strictly Isolated)
    ctx.save();

    // Apply Global Camera Shake (Affects Play Area + HUD Offset)
    const shakeX = game.shakeRef.current.x;
    const shakeY = game.shakeRef.current.y;

    // Play Area Translation: (0, 0) logic -> (0, HUD_TOP) visual
    ctx.translate(shakeX, shakeY + HUD_TOP_HEIGHT);

    // Dynamic Height Calculation: Use available height minus top HUD
    // This allows rendering to extend to the bottom of the screen
    const playAreaHeight = height - HUD_TOP_HEIGHT;

    // CLIP: Ensure no entities/FX leak into HUD zones
    ctx.beginPath();
    ctx.rect(0, 0, width, playAreaHeight);
    ctx.clip();

    // Game Over Distortion (Inside Play Area)
    if (game.status === GameStatus.GAME_OVER) {
        ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
    }

    // ── CAMERA TRANSFORM ──
    const cx = width / 2;
    const cy = playAreaHeight / 2;

    // 1. Move to Screen Center
    ctx.translate(cx, cy);

    // 2. Apply Zoom
    ctx.scale(camera.zoom, camera.zoom);

    // 3. Apply Tilt (Y-Axis Compression)
    // Tilt of 0 means no compression (cos(0) = 1)
    // Tilt increases, cos decreases, view flattens
    const tiltScale = Math.cos(camera.tilt || 0);
    ctx.scale(1, tiltScale);

    // 4. Translate World to Center
    // We want the camera position (camera.x, camera.y) to be at the origin (0,0)
    ctx.translate(-camera.x, -camera.y);

    // PASS 0: FLOOR (Side Scroll Only)
    if (camera.mode === CameraMode.SIDE_SCROLL || camera.targetMode === CameraMode.SIDE_SCROLL) {
        const alpha = camera.mode === CameraMode.SIDE_SCROLL
            ? (camera.targetMode ? 1 - camera.transitionT : 1)
            : camera.transitionT;

        ctx.save();
        ctx.globalAlpha = alpha;
        renderFloor(rc);
        ctx.restore();
    }

    // PASS 1: ENVIRONMENT & GRID (Local to Play Area)
    renderEnvironment(rc, game.wallsRef.current, game.terminalsRef.current, game.snakeRef.current[0]);

    // PASS 2: ENTITIES (SORTED)
    renderEntities(
        rc,
        game.minesRef.current,
        game.foodRef.current,
        game.enemiesRef.current,
        game.snakeRef.current,
        game.prevTailRef.current,
        game.directionRef.current,
        game.statsRef.current,
        game.selectedChar,
        moveProgress,
        game.powerUpsRef.current,
        game.nanoSwarmAngleRef.current,
        game.tailIntegrityRef.current,
        game.phaseRailChargeRef.current,
        game.echoDamageStoredRef.current,
        game.prismLanceTimerRef.current,
        game.enemyVisualsRef.current, // VISUAL SEPARATION
        game.terminalsRef.current     // For depth sorting with snake
    );

    // PASS 3: PROJECTILES
    renderProjectiles(rc, game.projectilesRef.current);

    // PASS 4: FX
    renderFX(
        rc,
        game.shockwavesRef.current,
        game.lightningArcsRef.current,
        game.particlesRef.current,
        game.floatingTextsRef.current,
        game.digitalRainRef.current,
        game.chromaticAberrationRef.current
    );

    // PASS 5: DEBUG
    renderDebug(ctx, game, rc);

    ctx.restore(); // End Play Area Isolation

    // 5. GLOBAL OVERLAYS (Transition effects that cover everything including HUD)
    if (game.status === GameStatus.STAGE_TRANSITION) {
        renderUI(rc, game.status, game.transitionStartTimeRef.current);
    }

    // NEW: Death Animation Overlay
    if (game.status === GameStatus.DYING) {
        const maxTime = 2000;
        const timeLeft = game.deathTimerRef.current;
        const progress = 1 - (Math.max(0, timeLeft) / maxTime);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space

        // Fade to Dark Red (#450a0a matches GameOverScreen bg-red-950)
        // Quad easing for dramatic finish
        const alpha = Math.pow(progress, 2);
        ctx.fillStyle = `rgba(69, 10, 10, ${alpha})`;
        ctx.fillRect(0, 0, width, height);

        // Visual Glitches overlay
        if (progress > 0.1) {
            const intensity = progress;
            ctx.globalCompositeOperation = 'overlay';

            // Horizontal Red Strips (Data Corruption)
            if (Math.random() < intensity * 0.3) {
                ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.5})`;
                const h = Math.random() * height * 0.1;
                const y = Math.random() * height;
                ctx.fillRect(0, y, width, h);
            }

            // White Noise Flashes
            if (Math.random() < intensity * 0.1) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
                ctx.fillRect(0, 0, width, height);
            }
        }

        ctx.restore();
    }
};
