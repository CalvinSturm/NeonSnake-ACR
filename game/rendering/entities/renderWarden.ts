
import { Enemy } from '../../../types';
import { drawShadow, drawVolumetricThruster } from '../primitives';

export const renderWarden = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    now: number,
    gridSize: number,
    reduceFlashing: boolean = false // Added param
) => {
    const stateId = e.bossState?.stateId || 'IDLE';
    const facing = e.facing || 1; // 1 = Right, -1 = Left
    const isTelegraph = stateId.includes('TELEGRAPH');
    const isExecute = stateId.includes('EXECUTE');
    const isRecovery = stateId.includes('RECOVERY');
    const isSweep = stateId.includes('SWEEP');
    
    // Calculate color based on state urgency
    let coreColor = '#4488ff'; // Idle Blue
    if (isTelegraph) coreColor = '#ffaa00'; // Warning Orange
    if (isExecute) coreColor = '#ff0000';   // Danger Red
    if (isRecovery) coreColor = '#888888';  // Vulnerable Grey

    ctx.save();
    
    // Flip context based on facing
    ctx.scale(facing, 1);

    // 1. Shadow
    ctx.save();
    ctx.translate(0, 20); // Floor offset
    drawShadow(ctx, 0, 0, 25, 8);
    ctx.restore();

    // Hover Bob
    const hoverY = Math.sin(now / 800) * 4;
    ctx.translate(0, hoverY);

    // 2. Thrusters (It hovers)
    ctx.save();
    ctx.rotate(Math.PI/2);
    // Back thruster pack
    drawVolumetricThruster(ctx, 0, -10, 8, 20, '#4488ff', now);
    ctx.restore();

    // 3. Body (Heavy Armor - Knight Style)
    // Dark plating with cyan trim
    const armorDark = '#1a1a1a';
    const armorLight = '#333';
    
    // LEGS
    ctx.fillStyle = armorDark;
    // Back Leg
    ctx.beginPath();
    ctx.moveTo(-10, -5); ctx.lineTo(-15, 20); ctx.lineTo(-5, 25); ctx.lineTo(0, 0);
    ctx.fill();
    // Front Leg
    ctx.beginPath();
    ctx.moveTo(5, -5); ctx.lineTo(0, 20); ctx.lineTo(10, 25); ctx.lineTo(15, 0);
    ctx.fill();

    // Crouch during recovery
    const squat = isRecovery ? 8 : 0;

    // TORSO
    ctx.save();
    ctx.translate(0, squat);
    
    const chestW = 24;
    const chestH = 32;
    
    // Chest Plate
    const grad = ctx.createLinearGradient(-10, 0, 10, 0);
    grad.addColorStop(0, armorLight);
    grad.addColorStop(0.5, armorDark);
    grad.addColorStop(1, armorLight);
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.moveTo(-chestW/2, -chestH); // Top Left
    ctx.lineTo(chestW/2, -chestH);  // Top Right
    ctx.lineTo(chestW/2 - 4, 0);    // Bot Right
    ctx.lineTo(0, 5);               // Crotch point
    ctx.lineTo(-chestW/2 + 4, 0);   // Bot Left
    ctx.closePath();
    ctx.fill();
    
    // Core Light (Chest)
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, -chestH + 8);
    ctx.lineTo(4, -chestH + 14);
    ctx.lineTo(0, -chestH + 20);
    ctx.lineTo(-4, -chestH + 14);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HEAD (Helm)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-8, -chestH - 2);
    ctx.lineTo(8, -chestH - 2);
    ctx.lineTo(10, -chestH - 12);
    ctx.lineTo(0, -chestH - 16); // Crest
    ctx.lineTo(-10, -chestH - 12);
    ctx.closePath();
    ctx.fill();
    
    // Visor
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(2, -chestH - 10, 6, 2); // Single eye slit
    ctx.shadowBlur = 0;

    // ARMS & WEAPON
    ctx.save();
    ctx.translate(0, -chestH + 5); // Shoulder pivot
    
    let armRot = 0;
    let swordRot = 0;
    
    if (isSweep) {
        if (isTelegraph) { armRot = -2.5; swordRot = -1.0; }
        else if (isExecute) { armRot = 1.0; swordRot = 1.5; }
        else if (isRecovery) { armRot = 0.8; swordRot = 2.0; }
        else { armRot = -0.5; }
    } else {
        // Overhead
        if (isTelegraph) { armRot = -0.5; swordRot = -1.5; }
        else if (isExecute) { armRot = 2.0; swordRot = 1.5; }
        else if (isRecovery) { armRot = 1.8; swordRot = 1.8; }
    }

    ctx.rotate(armRot);
    
    // Shoulder Pauldron
    ctx.fillStyle = armorLight;
    ctx.beginPath();
    ctx.arc(0, 0, 10, Math.PI, 0);
    ctx.fill();
    
    // Arm Segment
    ctx.fillStyle = '#333';
    ctx.fillRect(-4, 0, 24, 8);
    
    // Weapon Pivot (Hand)
    ctx.translate(20, 4);
    ctx.rotate(swordRot);
    
    // GREATSWORD
    const swordL = 70;
    const swordW = 12;
    
    // Blade Hilt
    ctx.fillStyle = '#111';
    ctx.fillRect(-5, -swordW, 10, swordW*2);
    
    // Blade
    ctx.fillStyle = isExecute ? '#fff' : '#aaa'; 
    if (isExecute) {
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 20;
    }
    
    // Energy Edge
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, -swordW/2);
    ctx.lineTo(swordL, 0); // Tip
    ctx.lineTo(0, swordW/2);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Energy Trail (During attack)
    if (isExecute) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, -swordW);
        ctx.lineTo(-40, 0);
        ctx.lineTo(0, swordW);
        ctx.fill();
    }

    ctx.restore(); // End Arms
    ctx.restore(); // End Torso
    
    // Glitch Effect (Phase 2)
    if (e.bossPhase === 2 && Math.random() < 0.1 && !reduceFlashing) {
        ctx.fillStyle = '#fff';
        ctx.globalCompositeOperation = 'xor';
        ctx.fillRect(-20, -40, 40, 60);
    }

    ctx.restore(); // End Facing
};
