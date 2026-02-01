
import { Enemy, EnemyType } from '../../../types';
import { COLORS } from '../../../constants';
import { drawVolumetricThruster, drawEntity25D, drawShadow } from '../primitives';
import { UIRequest } from '../types';
import { localToScreen } from '../camera/projectToScreen';

const renderHunter = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e?: Enemy) => {
    // Top Layer Only (Base is handled by system)
    const isAttacking = e?.intent === 'ATTACKING';
    const thrusterIntensity = isAttacking ? 1.5 : 1.0;

    // Thruster (Behind) - pulses when attacking
    drawVolumetricThruster(ctx, -10, 0, 6 * thrusterIntensity, 18 * thrusterIntensity, accent, now);

    // Main Body
    const grad = ctx.createLinearGradient(-10, 0, 10, 0);
    grad.addColorStop(0, '#111');
    grad.addColorStop(0.5, hull);
    grad.addColorStop(1, '#222');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();

    // Edge glow when attacking
    if (isAttacking) {
        ctx.strokeStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Eye - pulses when attacking
    const eyeSize = isAttacking ? 3.5 + Math.sin(now * 0.02) * 0.5 : 3;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = isAttacking ? 15 : 10;
    ctx.beginPath();
    ctx.arc(2, 0, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(3, -1, 1, 0, Math.PI * 2);
    ctx.fill();
};

const renderInterceptor = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e?: Enemy) => {
    const isStrafing = e?.aiState === 'STRAFE';
    const isApproaching = e?.aiState === 'APPROACH';
    const engineBoost = isApproaching ? 1.5 : (isStrafing ? 1.2 : 1.0);

    // Twin Engines - boost when moving aggressively
    drawVolumetricThruster(ctx, -8, -5, 4 * engineBoost, 30 * engineBoost, accent, now, 100);
    drawVolumetricThruster(ctx, -8, 5, 4 * engineBoost, 30 * engineBoost, accent, now, 200);

    const grad = ctx.createLinearGradient(-10, 0, 20, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.4, hull);
    grad.addColorStop(1, '#eee');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();

    // Wings - glow when strafing
    ctx.fillStyle = isStrafing ? '#2a2a2a' : '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-12, -14);
    ctx.closePath();
    ctx.fill();

    if (isStrafing) {
        ctx.strokeStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Lights - blink when approaching
    const lightAlpha = isApproaching ? 0.5 + Math.sin(now * 0.03) * 0.5 : 1.0;
    ctx.globalAlpha = lightAlpha;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.fillRect(-10, -5, 4, 2);
    ctx.fillRect(-10, 3, 4, 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
};

const renderShooter = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e: Enemy) => {
    const isCharging = e.aiState === 'CHARGE';
    const isFiring = e.aiState === 'FIRE';
    const isRepositioning = e.aiState === 'REPOSITION';

    // Reduced thruster when stationary for aiming
    const thrusterMod = (isCharging || isFiring) ? 0.5 : (isRepositioning ? 1.3 : 1.0);
    drawVolumetricThruster(ctx, -12, 0, 10 * thrusterMod, 12 * thrusterMod, accent, now);

    // Body glows during charge
    ctx.fillStyle = hull;
    if (isCharging) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10 + Math.sin(now * 0.02) * 5;
    }
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 12);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Core - pulses during charge
    const coreSize = isCharging ? 12 + Math.sin(now * 0.015) * 2 : 12;
    ctx.fillStyle = isCharging ? '#333' : '#222';
    ctx.fillRect(-6, -coreSize / 2, coreSize, coreSize);

    // Cannon
    ctx.save();
    const chargeProgress = e.attackTimer ? Math.min(1, e.attackTimer / 1500) : 0;
    const recoil = isFiring ? 4 : 0;

    ctx.fillStyle = isCharging ? '#222' : '#111';
    ctx.fillRect(0 - recoil, -3, 16, 6);
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Charge indicator
    if (isCharging && chargeProgress > 0) {
        const flicker = 0.7 + Math.random() * 0.3;
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 15 * chargeProgress * flicker;
        ctx.beginPath();
        ctx.arc(16, 0, 2 + (chargeProgress * 4), 0, Math.PI * 2);
        ctx.fill();

        // Energy buildup in core
        ctx.globalAlpha = chargeProgress * 0.6;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.globalAlpha = 1.0;

        // Warning indicator
        if (chargeProgress > 0.7) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Muzzle flash when firing
    if (isFiring) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accent;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(18 - recoil, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Border ring
    ctx.strokeStyle = isCharging ? '#ffffff' : accent;
    ctx.lineWidth = isCharging ? 2 : 1;
    ctx.strokeRect(-5, -5, 10, 10);
};

const renderDasher = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e: Enemy) => {
    const isDashing = e.dashState === 'DASH';
    const isCharging = e.dashState === 'CHARGE';
    const isCooldown = e.dashState === 'COOLDOWN' || e.aiState === 'COOLDOWN';
    const isChasing = e.aiState === 'CHASE';

    // Thruster intensity based on state
    let boost = 1.0;
    if (isDashing) boost = 3.0;
    else if (isCharging) boost = 0.3;  // Barely any thrust while charging
    else if (isChasing) boost = 1.5;

    drawVolumetricThruster(ctx, -5, 0, 8 * boost, 15 * boost, accent, now);

    // Body - trembles during charge
    ctx.save();
    if (isCharging) {
        ctx.translate(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
    }

    ctx.fillStyle = isCooldown ? '#1a0a00' : hull;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(4, 6);
    ctx.lineTo(-4, 10);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 0);
    ctx.lineTo(0, -4);
    ctx.lineTo(-4, -10);
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fill();

    // Outline glow based on state
    if (isDashing) {
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = accent;
        ctx.shadowBlur = 25;
        ctx.lineWidth = 3;
        ctx.stroke();
    } else if (isCharging) {
        ctx.strokeStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10 + Math.sin(now * 0.05) * 5;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // Energy trails when charging or dashing
    if (isCharging || isDashing) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = isDashing ? 20 : 10;
        ctx.strokeStyle = accent;
        ctx.lineWidth = isDashing ? 3 : 2;

        // Trailing energy lines
        const trailLength = isDashing ? 25 : 12;
        ctx.beginPath();
        ctx.moveTo(4, 6);
        ctx.lineTo(4 + trailLength, 10 + (isDashing ? 5 : 0));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, -6);
        ctx.lineTo(4 + trailLength, -10 - (isDashing ? 5 : 0));
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Vulnerable indicator during cooldown
    if (isCooldown) {
        ctx.strokeStyle = '#666666';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Core eye - changes color based on state
    let eyeColor = '#fff';
    if (isCharging) eyeColor = accent;
    else if (isDashing) eyeColor = '#ffffff';
    else if (isCooldown) eyeColor = '#666666';

    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = isDashing ? 15 : 5;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(2, 2);
    ctx.lineTo(2, -2);
    ctx.fill();
    ctx.shadowBlur = 0;
};

export const renderEnemy = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    gridSize: number,
    halfGrid: number,
    snakeHead: any,
    now: number,
    reduceFlashing: boolean,
    tilt: number = 0, // Camera Tilt passed from renderer
    flash: number = 0 // VISUAL SEPARATION: Pass flash explicitly
): UIRequest | void => {
    let color = COLORS.enemyHunter;
    let accentColor = '#ef4444';
    let hullColor = '#1a0505';
    let scale = 1.0;
    let height = 20; // Default height

    switch (e.type) {
        case EnemyType.INTERCEPTOR:
            color = COLORS.enemyInterceptor;
            accentColor = '#d946ef';
            hullColor = '#1a051a';
            scale = 0.9;
            height = 30; // Flyers are higher visually
            break;
        case EnemyType.SHOOTER:
            color = COLORS.enemyShooter;
            accentColor = '#22c55e';
            hullColor = '#051a05';
            scale = 1.2;
            height = 25;
            break;
        case EnemyType.DASHER:
            color = COLORS.enemyDasher;
            accentColor = '#f97316';
            hullColor = '#1a1005';
            height = 15; // Low profile
            break;
        case EnemyType.HUNTER:
        default:
            height = 20;
            break;
    }

    if (flash > 0 && !reduceFlashing) {
        hullColor = '#ffffff';
        color = '#ffffff';
        accentColor = '#ffffff';
    }

    let angle = 0;
    if (snakeHead) {
        const dx = snakeHead.x - e.x;
        const dy = snakeHead.y - e.y;
        angle = Math.atan2(dy, dx);
    } else if (e.vx || e.vy) {
        angle = Math.atan2(e.vy, e.vx);
    }

    const hoverY = Math.sin(now / 250 + e.x) * 4;

    // Use 2.5D Draw System and get Anchors
    const anchors = drawEntity25D(
        ctx,
        0, // Local X (Relative to entity center)
        hoverY, // Local Y (Base bobbing)
        height,
        tilt,
        angle,
        {
            shadow: () => {
                const shadowScale = 1.0 - (hoverY / 40);
                // Rotate shadow manually to match enemy orientation on the ground
                // We must rotate AROUND the base (0,0), so we translate to shadow offset first?
                // The drawEntity25D implementation does NOT rotate shadows. 
                // So we do it here.
                ctx.save();
                // Move to ground position relative to entity center
                ctx.translate(0, -hoverY);
                ctx.rotate(angle);
                // Increased base radius multiplier from 0.6 to 0.9 for visibility
                // Note: We use (0,0) because we already translated to the shadow spot
                drawShadow(ctx, 0, 0, gridSize * 0.9 * scale * shadowScale, 8);
                ctx.restore();
            },
            body: (offset) => {
                // Draw connecting wall if tilt > 0
                if (tilt > 0.1) {
                    ctx.fillStyle = '#0a0a0a'; // Dark underside
                    ctx.strokeStyle = accentColor;
                    ctx.globalAlpha = 0.3;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    // Draw a simple connector line or box
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, offset); // Offset is -z*tilt (negative), so this draws 'up'
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            },
            top: (offset) => {
                // Isolated state for scale
                ctx.save();
                ctx.scale(scale, scale);
                // Delegate to specific renderers (Top Face)
                switch (e.type) {
                    case EnemyType.INTERCEPTOR:
                        renderInterceptor(ctx, hullColor, accentColor, now, e);
                        break;
                    case EnemyType.SHOOTER:
                        renderShooter(ctx, hullColor, accentColor, now, e);
                        break;
                    case EnemyType.DASHER:
                        renderDasher(ctx, hullColor, accentColor, now, e);
                        break;
                    case EnemyType.HUNTER:
                    default:
                        renderHunter(ctx, hullColor, accentColor, now, e);
                        break;
                }

                if (e.stunTimer && e.stunTimer > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 10;
                    ctx.rotate(now * 0.01);
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    const r = gridSize * 0.9;
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
            }
        }
    );

    // Return UI Request for Health Bar
    if (e.hp < e.maxHp) {
        // Convert the Local Top Anchor to Absolute Screen Coordinates
        // The health bar should float distinctly above the top of the entity
        // Increased offset from -10 to -20 to avoid clipping 
        const screenPos = localToScreen(ctx, anchors.top.x, anchors.top.y - 20);

        return {
            type: 'HEALTH_BAR',
            x: screenPos.x,
            y: screenPos.y,
            value: e.hp,
            max: e.maxHp,
            color: '#00ff00',
            width: gridSize * 1.5,
            height: 4
        };
    }
};
