import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { getInterpolatedSegments } from '../../utils/interpolation';
import { drawShadow, drawVolumetricThruster } from '../primitives';
import { SNAKE_RENDERERS } from './snakeRenderers';

export const renderSnake = (
    rc: RenderContext,
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    visualNsAngle: number,
    tailIntegrity: number,
    phaseRailCharge: number,
    echoDamageStored: number,
    prismLanceTimer: number
) => {
    if (snake.length === 0) return;

    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    // ─────────────────────────────────────────────
    // CALCULATE VISUAL SEGMENT POSITIONS
    // ─────────────────────────────────────────────
    const segments = getInterpolatedSegments(
        snake,
        prevTail,
        moveProgress,
        gridSize,
        halfGrid
    );

    const headCx = segments[0].x;
    const headCy = segments[0].y;

    // ─────────────────────────────────────────────
    // RESOLVE STYLE
    // ─────────────────────────────────────────────
    let style = rc.snakeStyle || 'AUTO';
    if (style === 'AUTO') {
        if (charProfile?.id === 'spectre') style = 'FLUX';
        else if (charProfile?.id === 'volt') style = 'NEON';
        else if (charProfile?.id === 'rigger') style = 'PIXEL';
        else if (charProfile?.id === 'bulwark') style = 'MECH';
        else if (charProfile?.id === 'overdrive') style = 'GLITCH';
        else if (charProfile?.id === 'striker') style = 'MECH';
        else style = 'MECH';
    }

    // ─────────────────────────────────────────────
    // 1. RENDER SNAKE BODY (REGISTRY DISPATCH)
    // ─────────────────────────────────────────────
    const renderer =
        SNAKE_RENDERERS[style] ??
        SNAKE_RENDERERS.MECH;

    renderer(
        rc,
        snake,
        prevTail,
        direction,
        stats,
        charProfile,
        moveProgress,
        visualNsAngle,
        tailIntegrity,
        phaseRailCharge,
        echoDamageStored,
        prismLanceTimer
    );

    // ─────────────────────────────────────────────
    // 2. ATTACHMENTS (Shared overlays)
    // ─────────────────────────────────────────────

    // PHASE RAIL
    if (stats.weapon.phaseRailLevel > 0) {
        const maxCharge = 4000 / stats.globalFireRateMod;
        const pct = Math.min(1, phaseRailCharge / maxCharge);

        if (pct > 0.05) {
            ctx.save();
            ctx.translate(headCx, headCy);

            let rot = 0;
            switch (direction) {
                case 'RIGHT': rot = 0; break;
                case 'DOWN': rot = Math.PI / 2; break;
                case 'LEFT': rot = Math.PI; break;
                case 'UP': rot = -Math.PI / 2; break;
            }
            ctx.rotate(rot);

            ctx.globalCompositeOperation = 'screen';
            const partCount = 10 + Math.floor(pct * 15);

            for (let i = 0; i < partCount; i++) {
                const flowSpeed = 0.002 + pct * 0.008;
                const t = ((now * flowSpeed) + (i / partCount)) % 1;
                const chaos = (1 - Math.pow(pct, 3)) * 20;

                const r = (1 - t) * 45;
                const theta = (t * 12) + (i * 1.5) + (now * 0.002);
                const railY = (i % 2 === 0 ? -1 : 1) * 7;

                const jitterX = Math.sin((now * 0.02) + (i * 13)) * chaos;
                const jitterY = Math.cos((now * 0.03) + (i * 7)) * chaos;

                const px = 5 - r + jitterX;
                const py = railY + (Math.sin(theta) * r * 0.3) + jitterY;

                const alpha = Math.sin(t * Math.PI) * (0.3 + pct * 0.7);
                const pSize = 1 + (pct * 2);

                ctx.fillStyle = `rgba(180, 100, 255, ${alpha})`;
                ctx.fillRect(px, py, pSize, pSize);
            }

            ctx.globalCompositeOperation = 'source-over';

            const extension = Math.pow(pct, 0.5) * 16;
            const gap = 9 - (pct * 3);
            const opacity = 0.4 + (pct * 0.6);
            const isReady = pct > 0.95;

            ctx.strokeStyle = isReady
                ? `rgba(255,255,255,${0.8 + Math.sin(now * 0.5) * 0.2})`
                : `rgba(200,150,255,${opacity})`;

            ctx.fillStyle = `rgba(20,10,30,${opacity * 0.8})`;
            ctx.lineWidth = isReady ? 1.5 : 1;

            if (isReady) {
                ctx.shadowColor = COLORS.phaseRail;
                ctx.shadowBlur = 15;
            }

            const drawRail = (yMul: number) => {
                const y = yMul * gap;
                ctx.beginPath();
                ctx.moveTo(-4, y);
                ctx.lineTo(8 + extension, y);
                ctx.lineTo(6 + extension, y + (yMul * 4));
                ctx.lineTo(-6, y + (yMul * 4));
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            };

            drawRail(-1);
            drawRail(1);

            if (pct > 0.15) {
                ctx.globalCompositeOperation = 'screen';
                const coreLen = 14 * pct;
                const coreH = 3 * pct + (isReady ? Math.sin(now * 0.8) : 0);

                const grad = ctx.createLinearGradient(0, 0, 10 + coreLen, 0);
                grad.addColorStop(0, COLORS.phaseRail);
                grad.addColorStop(0.5, '#ffffff');
                grad.addColorStop(1, COLORS.phaseRail);

                ctx.fillStyle = grad;
                ctx.shadowColor = COLORS.phaseRail;
                ctx.shadowBlur = 15 * pct;

                ctx.beginPath();
                ctx.ellipse(
                    5 + coreLen / 2,
                    0,
                    coreLen / 2,
                    coreH,
                    0,
                    0,
                    PI2
                );
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // PRISM LANCE
    if (stats.weapon.prismLanceLevel > 0) {
        const fireRate = 2000 / stats.globalFireRateMod;
        const pct = Math.min(1, prismLanceTimer / fireRate);

        ctx.save();
        ctx.translate(headCx, headCy);
        ctx.translate(0, Math.sin(now * 0.003) * 3 - 25);
        ctx.rotate(now * 0.001);
        ctx.scale(1, 0.7);

        const size = 4.5;
        const corner = size * 0.3;

        const drawAsscher = (s: number, c: number) => {
            ctx.beginPath();
            ctx.moveTo(s, -s + c);
            ctx.lineTo(s - c, -s);
            ctx.lineTo(-s + c, -s);
            ctx.lineTo(-s, -s + c);
            ctx.lineTo(-s, s - c);
            ctx.lineTo(-s + c, s);
            ctx.lineTo(s - c, s);
            ctx.lineTo(s, s - c);
            ctx.closePath();
        };

        const opacity = 0.2 + pct * 0.8;
        const intensity = Math.floor(pct * 255);

        ctx.fillStyle = `rgba(0,${intensity},${intensity},${opacity})`;

        if (pct > 0.95) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#f0ffff';
        }

        drawAsscher(size, corner);
        ctx.fill();

        ctx.strokeStyle = `rgba(0,255,255,${0.5 + pct * 0.5})`;
        ctx.lineWidth = 1.2;
        drawAsscher(size, corner);
        ctx.stroke();

        drawAsscher(size * 0.6, (size * 0.6) * 0.3);
        ctx.stroke();

        ctx.restore();
    }

    // ECHO CACHE
    if (stats.weapon.echoCacheLevel > 0) {
        const cap = 500 + stats.weapon.echoCacheLevel * 500;
        const pct = Math.min(1, echoDamageStored / cap);

        if (pct > 0) {
            ctx.save();
            ctx.translate(headCx, headCy);
            ctx.rotate(now / -300);

            const gradient = ctx.createConicGradient(now / 500, 0, 0);
            gradient.addColorStop(0, 'rgba(255,170,0,0.5)');
            gradient.addColorStop(pct, '#ffaa00');
            gradient.addColorStop(1, 'rgba(255,170,0,0)');

            ctx.lineWidth = 3 + Math.sin(now / 200) * 1.5;
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, PI2 * pct);
            ctx.stroke();

            ctx.restore();
        }
    }

    // SHIELD
    if (stats.shieldActive) {
        ctx.save();
        ctx.translate(headCx, headCy);
        ctx.scale(1, 0.8);
        ctx.rotate(now / 800);

        const radius = 17;
        const energyPulse = 0.3 + Math.sin(now / 300) * 0.1;

        const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
        grad.addColorStop(0, 'rgba(0,255,255,0)');
        grad.addColorStop(0.7, `rgba(0,255,255,${energyPulse * 0.3})`);
        grad.addColorStop(1, `rgba(0,255,255,${energyPulse})`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, PI2);
        ctx.fill();

        const segments = 3;
        const gap = 0.4;
        const arcLen = (PI2 / segments) - gap;

        ctx.shadowColor = COLORS.shield;
        ctx.shadowBlur = 10;

        for (let i = 0; i < segments; i++) {
            const a = i * (PI2 / segments);
            ctx.beginPath();
            ctx.arc(0, -5, radius, a, a + arcLen);
            ctx.arc(0, 5, radius, a + arcLen, a, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0,100,100,0.3)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = COLORS.shield;
            ctx.stroke();
        }

        ctx.restore();
    }

    // NANO SWARM
    if (stats.weapon.nanoSwarmLevel > 0) {
        const count = stats.weapon.nanoSwarmCount;
        const radiusX = 3.8 * gridSize;
        const radiusY = radiusX * 0.7;

        for (let i = 0; i < count; i++) {
            const angle = visualNsAngle + (i * PI2) / count;
            const sx = headCx + Math.cos(angle) * radiusX;
            const sy = headCy + Math.sin(angle) * radiusY;

            drawShadow(ctx, sx, sy + 25, 5);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.atan2(
                radiusY * Math.cos(angle),
                -radiusX * Math.sin(angle)
            ));

            drawVolumetricThruster(
                ctx,
                -3,
                0,
                4,
                10,
                COLORS.nanoSwarm,
                now,
                i * 200
            );

            const hullGrad = ctx.createLinearGradient(-4, -4, 4, 4);
            hullGrad.addColorStop(0, '#ffffff');
            hullGrad.addColorStop(0.5, COLORS.nanoSwarm);
            hullGrad.addColorStop(1, '#220011');

            ctx.fillStyle = hullGrad;
            ctx.shadowColor = COLORS.nanoSwarm;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-3, 4);
            ctx.lineTo(-1, 0);
            ctx.lineTo(-3, -4);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }
};