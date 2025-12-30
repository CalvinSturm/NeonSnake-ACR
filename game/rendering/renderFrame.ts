
import { RenderContext } from './types';
import { useGameState } from '../useGameState';
import { DEFAULT_SETTINGS, HUD_TOP_HEIGHT, PLAY_AREA_HEIGHT, COLORS } from '../../constants';
import { renderBackground } from './passes/renderBackground';
import { renderEnvironment } from './passes/renderEnvironment';
import { renderEntities } from './passes/renderEntities';
import { renderProjectiles } from './passes/renderProjectiles';
import { renderFX, renderCLIAnimations } from './passes/renderFX';
import { renderUI } from './passes/renderUI';
import { renderFloor } from './floor/FloorRenderer';
import { CameraMode } from '../../types';
import { projectInterpolated } from './camera/projectInterpolated';

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
    
    const rc: RenderContext = {
        ctx,
        now,
        gameTime: game.gameTimeRef.current,
        width,
        height,
        gridSize,
        halfGrid: gridSize / 2,
        stageReady: game.stageReadyRef.current,
        uiStyle,
        snakeStyle: game.settings.snakeStyle,
        camera // Pass camera state
    };

    // 2. Global Clear & Background (Draws behind HUDs)
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Parallax Starfield (Global, behind HUD)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    const speed = camera.mode === CameraMode.SIDE_SCROLL ? 0.05 : 0.02;
    // Parallax Offset
    const pxOffset = camera.mode === CameraMode.SIDE_SCROLL ? -(camera.x * 0.1) : 0;
    
    const starCount = 40;
    for(let i=0; i<starCount; i++) {
        const x = ((i * 137.5) + (now * speed) + pxOffset) % (width);
        const y = ((i * 263.1) + (now * speed * 0.5)) % (height);
        const size = (Math.sin(now * 0.001 + i) + 2);
        ctx.globalAlpha = 0.3 + Math.sin(now * 0.002 + i) * 0.2;
        ctx.fillRect(x, y, size, size);
    }
    ctx.restore();

    // 3. PLAY AREA (Strictly Isolated)
    ctx.save();
    
    // Apply Global Camera Shake (Affects Play Area + HUD Offset)
    const shakeX = game.shakeRef.current.x;
    const shakeY = game.shakeRef.current.y;
    
    // Play Area Translation: (0, 0) logic -> (0, HUD_TOP) visual
    ctx.translate(shakeX, shakeY + HUD_TOP_HEIGHT);
    
    // CLIP: Ensure no entities/FX leak into HUD zones
    ctx.beginPath();
    ctx.rect(0, 0, width, PLAY_AREA_HEIGHT);
    ctx.clip();

    // Game Over Distortion (Inside Play Area)
    if (game.status === 'GAME_OVER') {
       ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
    }

    // ── CAMERA TRANSFORM (INTERPOLATED) ──
    // Determine the screen position of World(0,0). 
    // This effectively gives us the translation needed for the context.
    const origin = projectInterpolated(0, 0, camera);
    
    // ZOOM & ROTATION LOGIC:
    // Scale & Rotate around screen center
    const cx = width / 2;
    const cy = PLAY_AREA_HEIGHT / 2;
    
    ctx.translate(cx, cy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation); // Apply Rotation
    ctx.translate(-cx, -cy);
    
    ctx.translate(origin.x, origin.y);

    // PASS 0: FLOOR (Side Scroll Only - Fade during transition?)
    // Render floor if in SIDE_SCROLL OR transitioning TO/FROM it
    if (camera.mode === CameraMode.SIDE_SCROLL || camera.targetMode === CameraMode.SIDE_SCROLL) {
        // Opacity fade if transitioning?
        const alpha = camera.mode === CameraMode.SIDE_SCROLL 
            ? (camera.targetMode ? 1 - camera.transitionT : 1) 
            : camera.transitionT;
            
        ctx.save();
        ctx.globalAlpha = alpha;
        renderFloor(rc);
        ctx.restore();
    }

    // PASS 1: ENVIRONMENT & GRID (Local to Play Area)
    renderBackground(rc); // Grid lines only
    renderEnvironment(rc, game.wallsRef.current, game.terminalsRef.current, game.snakeRef.current[0]);

    // PASS 2: ENTITIES
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
        game.prismLanceTimerRef.current
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
    
    // PASS 5: CLI ANIMATIONS (New Layer)
    renderCLIAnimations(rc, game.cliAnimationsRef.current);

    ctx.restore(); // End Play Area Isolation

    // 4. GLOBAL OVERLAYS (Transition effects that cover everything including HUD)
    if (game.status === 'STAGE_TRANSITION') {
        renderUI(rc, game.status, game.transitionStartTimeRef.current);
    }
};
