import { RenderContext } from '../../types';

export const renderTailAura = (
    rc: RenderContext,
    segments: { x: number; y: number }[],
    radiusPx: number
) => {
    const { ctx, now, gridSize } = rc;
    if (segments.length < 2) return;

    const PI2 = Math.PI * 2;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const step = gridSize * 0.18;

    /*const step = gridSize * 0.25;
    const step = gridSize * 0.25;
    //Extreme density
    const step = gridSize * 0.18;

    */
    let dist = 0;

    const colorCore = 'rgba(80, 10, 60, 0.15)';
    const colorEdge = 'rgba(30, 0, 40, 0.05)';

    // Start at index 1 to exclude head
    for (let i = 1; i < segments.length - 1; i++) {
        const p1 = segments[i];
        const p2 = segments[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segLen = Math.hypot(dx, dy);

        for (let t = 0; t < segLen; t += step) {
            const px = p1.x + (dx * (t / segLen));
            const py = p1.y + (dy * (t / segLen));


            const noise =
                Math.sin((dist + t) * 0.1 - now * 0.003) *
                Math.cos((dist - t) * 0.15 + now * 0.002);

            const pulse = 1 + noise * 0.2;
            //Make it BIGGER (true area, not blur)
            //const blobRadius = radiusPx * pulse;
            const blobRadius = radiusPx * pulse * 1.4;



            ctx.save();
            ctx.translate(px, py);


            const g = ctx.createRadialGradient(
                0, 0, blobRadius * 0.2,
                0, 0, blobRadius
            );
            g.addColorStop(0, colorCore);
            g.addColorStop(0.6, colorEdge);
            g.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, blobRadius, 0, PI2);
            ctx.fill();

            ctx.restore();
        }

        dist += segLen;
    }

    ctx.restore();
};
