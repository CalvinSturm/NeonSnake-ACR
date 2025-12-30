
import { RenderContext } from '../types';
import { Projectile } from '../../../types';

export const renderProjectiles = (rc: RenderContext, projectiles: Projectile[]) => {
    const { ctx, now } = rc;

    projectiles.forEach(p => {
        if (p.shouldRemove) return;
        
        // Safety Check: Prevent rendering if coordinates are invalid (e.g. NaN)
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            p.shouldRemove = true;
            return;
        }
        
        // Physics Calculations
        const vx = p.vx || 0;
        const vy = p.vy || 0;
        const angle = Math.atan2(vy, vx);
        const speed = Math.hypot(vx, vy);
        const age = p.age || 0;

        ctx.save();
        ctx.translate(p.x, p.y);

        // 1. GROUND SHADOW PROJECTION (2.5D Depth)
        // Offset Y+15 to render on the "floor" beneath the floating projectile
        ctx.save();
        ctx.translate(0, 15); 
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        // Shadow elongates with speed to simulate motion blur/height
        const shadowLen = p.size + (speed * 0.4); 
        ctx.ellipse(0, 0, shadowLen, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. PROJECTILE BODY RENDER
        ctx.rotate(angle);

        // WEAPON SPECIFIC RENDERERS
        
        if (p.type === 'LANCE') {
            // 💎 PRISM LANCE: Multi-colored Spinning Vortex
            const length = 60;
            
            // 1. Central Core Beam (White/Cyan Hot)
            ctx.globalCompositeOperation = 'screen';
            const coreGrad = ctx.createLinearGradient(-length/2, 0, length/2, 0);
            coreGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
            coreGrad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
            coreGrad.addColorStop(0.8, '#ffffff');
            coreGrad.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = coreGrad;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.moveTo(length/2 + 5, 0);
            ctx.lineTo(-length/2, 1.5);
            ctx.lineTo(-length/2, -1.5);
            ctx.fill();
            ctx.shadowBlur = 0;

            // 2. Spinning Helix Vortex (Drill Effect)
            const strands = 3;
            const helixFreq = 0.4; // tightness of coils
            const helixAmp = 5;    // width of projectile
            const spinSpeed = now * 0.04; // rotation speed of the drill
            
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';

            for (let i = 0; i < strands; i++) {
                const phaseOffset = (i * Math.PI * 2) / strands;
                const hue = (now * 0.5 + i * (360/strands)) % 360;
                const color = `hsla(${hue}, 100%, 60%, 0.9)`;
                
                ctx.strokeStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                
                for (let x = -length/2; x < length/2; x += 3) {
                    const taper = Math.min(1, (length/2 - Math.abs(x)) / 10);
                    const currentAmp = helixAmp * taper;
                    const y = Math.sin(x * helixFreq + spinSpeed + phaseOffset) * currentAmp;
                    
                    if (x === -length/2) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

        } else if (p.type === 'SHARD') {
            // 💠 NEON SCATTER: Jagged Crystal Shrapnel
            const size = p.size * 1.8;
            
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(size, 0);             // Tip
            ctx.lineTo(-size, size * 0.6);   // Wing 1
            ctx.lineTo(-size * 0.4, 0);      // Notch
            ctx.lineTo(-size, -size * 0.6);  // Wing 2
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.moveTo(size * 0.6, 0);
            ctx.lineTo(-size * 0.2, 2);
            ctx.lineTo(-size * 0.2, -2);
            ctx.fill();

        } else if (p.type === 'RAIL') {
            // 🔋 PHASE RAIL: Heavy Magnetic Slug
            const length = 55;
            const width = p.size * 1.2;

            if (age < 6) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 15 + age * 6, 0, Math.PI * 2);
                ctx.stroke();
            }

            const grad = ctx.createLinearGradient(0, -width, 0, width);
            grad.addColorStop(0, p.color);
            grad.addColorStop(0.5, '#ffffff'); 
            grad.addColorStop(1, p.color);

            ctx.fillStyle = grad;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 25; 
            
            ctx.fillRect(-length/2, -width/2, length, width);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 5;
            for(let i = -1; i <= 1; i++) {
                const rx = i * 18;
                ctx.fillRect(rx, -width * 1.5, 3, width * 3);
            }

        } else if (p.type === 'SERPENT') {
            // 🐉 VOLT SERPENT: Living Energy Organism
            const idOffset = p.id ? p.id.charCodeAt(0) : 0;
            const wiggle = Math.sin((now * 0.015) + idOffset) * 4; 
            
            ctx.translate(0, wiggle); 

            const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, p.size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, p.color);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = grad;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.fillRect(2, -3, 2, 2);
            ctx.fillRect(2, 3, 2, 2);

        } else {
            // 🔫 STANDARD / AUTO CANNON / BOSS: Kinetic Energy Bolt
            const length = p.size * 5;
            const width = p.size * 1.2;

            // Gradient Tracer
            const grad = ctx.createLinearGradient(-length, 0, length, 0);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)'); // Invisible tail
            grad.addColorStop(0.5, p.color);                 // Color mid
            grad.addColorStop(1, '#ffffff');                 // White hot tip

            ctx.fillStyle = grad;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.ellipse(0, 0, length/2, width/2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
};
