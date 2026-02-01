
import { RenderContext, UIRequest } from '../types';
import { Mine, FoodItem, Enemy, EnemyType, FoodType, Point, Direction, EnemyVisualMap, Terminal } from '../../../types';
import { COLORS, DEFAULT_SETTINGS } from '../../../constants';
import { drawShadow, drawSphere } from '../primitives';
import { renderBoss } from '../entities/renderBoss';
import { renderWarden } from '../entities/renderWarden';
import { renderSpaceship } from '../entities/renderSpaceship';
import { renderEnemy } from '../entities/renderEnemy';
import { renderSnake } from '../entities/renderSnake';
import { renderTerminalPylon } from '../entities/renderTerminalPylon';

interface Renderable {
    y: number;
    draw: () => UIRequest | void;
}

export const renderEntities = (
    rc: RenderContext,
    mines: Mine[],
    food: FoodItem[],
    enemies: Enemy[],
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    powerUps: { magnetUntil: number },
    visualNsAngle: number,
    tailIntegrity: number,
    phaseRailCharge: number,
    echoDamageStored: number,
    prismLanceTimer: number,
    enemyVisuals: EnemyVisualMap, // VISUAL SEPARATION
    terminals: Terminal[] = []   // Added for depth sorting
) => {
    const { ctx, gridSize, halfGrid, now, gameTime, reduceFlashing } = rc;
    const PI2 = Math.PI * 2;
    const renderList: Renderable[] = [];

    // Store UI requests for the post-entity pass
    const uiQueue: UIRequest[] = [];

    // 1. MINES
    for (const m of mines) {
        if (m.shouldRemove) continue;
        const cx = m.x * gridSize + halfGrid;
        const cy = m.y * gridSize + halfGrid;

        renderList.push({
            y: m.y,
            draw: () => {
                const pulse = 1 + Math.sin(now / 200) * 0.1;
                ctx.beginPath();
                ctx.arc(cx, cy, m.triggerRadius * gridSize * pulse, 0, PI2);
                ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();

                drawShadow(ctx, cx, cy + 10, 6);

                ctx.save();
                ctx.translate(cx, cy);

                const hover = Math.sin(now / 300) * 2;
                ctx.translate(0, hover);
                ctx.rotate(now / 300);

                ctx.fillStyle = COLORS.mine;
                ctx.shadowColor = COLORS.mine;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                const s = 6;
                ctx.moveTo(-s, -s); ctx.lineTo(s, s);
                ctx.moveTo(s, -s); ctx.lineTo(-s, s);
                ctx.lineWidth = 3;
                ctx.strokeStyle = COLORS.mine;
                ctx.stroke();

                drawSphere(ctx, 0, 0, 4, '#ffaa00');
                ctx.restore();
                ctx.shadowBlur = 0;
            }
        });
    }

    // 2. FOOD & XP ORBS
    for (const f of food) {
        if (f.shouldRemove) continue;
        const cx = f.x * gridSize + halfGrid;
        const cy = f.y * gridSize + halfGrid;

        renderList.push({
            y: f.y,
            draw: () => {
                if (f.type === FoodType.XP_ORB) {
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy + 8, 4, 2, 0, 0, PI2);
                    ctx.fill();

                    ctx.save();
                    ctx.translate(cx, cy);

                    const hover = Math.sin((now / 200) + (f.x * 0.5)) * 4;
                    ctx.translate(0, hover);

                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = COLORS.xpOrb;
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath(); ctx.arc(0, 0, 6, 0, PI2); ctx.fill();
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, PI2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, PI2); ctx.fill();
                    ctx.restore();
                } else {
                    drawShadow(ctx, cx, cy + 12, 6);

                    ctx.save();
                    ctx.translate(cx, cy);

                    const hover = Math.sin(now / 300 + f.x) * 3;
                    ctx.translate(0, hover);

                    const size = 10;
                    ctx.rotate(now / 400 + (f.x * 0.2));
                    ctx.fillStyle = COLORS.foodNormal;
                    ctx.shadowColor = COLORS.foodNormal;
                    ctx.shadowBlur = 15;
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.fillRect(-size / 2, -size / 2, size, size / 3);
                    ctx.shadowBlur = 0;
                    ctx.restore();
                }
            }
        });
    }

    // 3. TERMINALS (Pylons for depth sorting - floor effects rendered in renderEnvironment)
    for (const t of terminals) {
        if (t.shouldRemove) continue;
        renderList.push({
            y: t.y,
            draw: () => {
                renderTerminalPylon(ctx, t, gridSize, halfGrid, now, snake[0]);
            }
        });
    }

    // 4. ENEMIES
    enemies.forEach(e => {
        if (e.shouldRemove) return;
        renderList.push({
            y: e.y,
            draw: () => {
                let scale = 1.0;
                if (e.state === 'SPAWNING') {
                    scale = Math.max(0, Math.min(1, (gameTime - e.spawnTime) / 500));
                }

                const cx = e.x * gridSize + halfGrid;
                const cy = e.y * gridSize + halfGrid;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(scale, scale);

                let req: UIRequest | void = undefined;

                if (e.type === EnemyType.BOSS) {
                    if (e.bossConfigId === 'WARDEN_07') {
                        renderWarden(ctx, e, now, gridSize, !!reduceFlashing);
                    } else if (e.bossConfigId === 'SPACESHIP_BOSS') {
                        renderSpaceship(ctx, e, gridSize, halfGrid, now, snake[0]);
                    } else {
                        renderBoss(ctx, e, now, gridSize, halfGrid, snake[0], !!reduceFlashing);
                    }
                } else {
                    // Collect UI requests from Standard Enemies
                    const vis = enemyVisuals.get(e.id);
                    const flash = vis ? vis.flash : 0;
                    req = renderEnemy(ctx, e, gridSize, halfGrid, snake[0], now, !!reduceFlashing, rc.camera.tilt, flash);
                }

                ctx.restore();
                return req;
            }
        });
    });

    // 5. SNAKE
    if (snake.length > 0) {
        const head = snake[0];
        renderList.push({
            y: head.y,
            draw: () => {
                renderSnake(
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
            }
        });
    }

    // 6. RENDER SORTED ENTITIES
    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(item => {
        const req = item.draw();
        if (req) uiQueue.push(req);
    });

    // 7. RENDER FLOATING UI (POST PASS)
    // We escape the camera transform to render UI in absolute screen coordinates
    // This prevents text/bars from being tilted or scaled by the 2.5D projection
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to Identity (Screen Space)

    uiQueue.forEach(ui => {
        if (ui.type === 'HEALTH_BAR') {
            const hpPct = Math.max(0, ui.value / ui.max);

            // Background with Border for high visibility
            ctx.fillStyle = '#000000';
            ctx.fillRect(ui.x - ui.width / 2 - 1, ui.y - 1, ui.width + 2, ui.height + 2);

            // White Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(ui.x - ui.width / 2 - 0.5, ui.y - 0.5, ui.width + 1, ui.height + 1);

            // Fill Color Logic
            let fillColor = '#00ff00';
            if (hpPct <= 0.2) fillColor = '#ff0000';
            else if (hpPct <= 0.5) fillColor = '#ffaa00';

            // Bar
            ctx.fillStyle = fillColor;
            ctx.fillRect(ui.x - ui.width / 2, ui.y, ui.width * hpPct, ui.height);
        }
    });

    ctx.restore();
};
