
import { Enemy } from '../../../types';
import { drawShadow, drawVolumetricThruster } from '../primitives';

export const renderWarden = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    now: number,
    gridSize: number,
    reduceFlashing: boolean = false
) => {
    const stateId = e.bossState?.stateId || 'IDLE';
    const facing = e.facing || 1;
    const isTelegraph = stateId.includes('TELEGRAPH');
    const isExecute = stateId.includes('EXECUTE');
    const isRecovery = stateId.includes('RECOVERY');
    const isSweep = stateId.includes('SWEEP');
    
    let coreColor = '#4488ff';
    if (isTelegraph) coreColor = '#ffaa00';
    if (isExecute) coreColor = '#ff0000';
    if (isRecovery) coreColor = '#888888';

    ctx.save();
    
    ctx.save();
    ctx.scale(facing, 1);
    ctx.translate(0, 20); 
    drawShadow(ctx, 0, 0, 25, 8);
    ctx.restore();

    ctx.scale(facing, 1);

    const hoverY = Math.sin(now / 800) * 4;
    ctx.translate(0, hoverY);

    ctx.save();
    ctx.rotate(Math.PI/2);
    drawVolumetricThruster(ctx, 0, -10, 8, 20, '#4488ff', now);
    ctx.restore();

    const armorDark = '#1a1a1a';
    const armorLight = '#333';
    
    ctx.fillStyle = armorDark;
    ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(-15, 20); ctx.lineTo(-5, 25); ctx.lineTo(0, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -5); ctx.lineTo(0, 20); ctx.lineTo(10, 25); ctx.lineTo(15, 0); ctx.fill();

    const squat = isRecovery ? 8 : 0;

    ctx.save();
    ctx.translate(0, squat);
    
    const chestW = 24;
    const chestH = 32;
    
    const grad = ctx.createLinearGradient(-10, 0, 10, 0);
    grad.addColorStop(0, armorLight); grad.addColorStop(0.5, armorDark); grad.addColorStop(1, armorLight);
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.moveTo(-chestW/2, -chestH); ctx.lineTo(chestW/2, -chestH);
    ctx.lineTo(chestW/2 - 4, 0); ctx.lineTo(0, 5); ctx.lineTo(-chestW/2 + 4, 0);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = coreColor; ctx.shadowColor = coreColor; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.moveTo(0, -chestH + 8); ctx.lineTo(4, -chestH + 14); ctx.lineTo(0, -chestH + 20); ctx.lineTo(-4, -chestH + 14); ctx.fill(); ctx.shadowBlur = 0;

    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.moveTo(-8, -chestH - 2); ctx.lineTo(8, -chestH - 2); ctx.lineTo(10, -chestH - 12); ctx.lineTo(0, -chestH - 16); ctx.lineTo(-10, -chestH - 12); ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = coreColor; ctx.shadowColor = coreColor; ctx.shadowBlur = 10;
    ctx.fillRect(2, -chestH - 10, 6, 2);
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(0, -chestH + 5); 
    
    let armRot = 0;
    let swordRot = 0;
    
    if (isSweep) {
        if (isTelegraph) { armRot = -2.5; swordRot = -1.0; }
        else if (isExecute) { armRot = 1.0; swordRot = 1.5; }
        else if (isRecovery) { armRot = 0.8; swordRot = 2.0; }
        else { armRot = -0.5; }
    } else {
        if (isTelegraph) { armRot = -0.5; swordRot = -1.5; }
        else if (isExecute) { armRot = 2.0; swordRot = 1.5; }
        else if (isRecovery) { armRot = 1.8; swordRot = 1.8; }
    }

    ctx.rotate(armRot);
    ctx.fillStyle = armorLight; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(-4, 0, 24, 8);
    
    ctx.translate(20, 4);
    ctx.rotate(swordRot);
    
    const swordL = 70; const swordW = 12;
    ctx.fillStyle = '#111'; ctx.fillRect(-5, -swordW, 10, swordW*2);
    ctx.fillStyle = isExecute ? '#fff' : '#aaa'; 
    if (isExecute) { ctx.shadowColor = coreColor; ctx.shadowBlur = 20; }
    ctx.strokeStyle = coreColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -swordW/2); ctx.lineTo(swordL, 0); ctx.lineTo(0, swordW/2); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    
    if (isExecute) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = coreColor; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(0, -swordW); ctx.lineTo(-40, 0); ctx.lineTo(0, swordW); ctx.fill();
    }

    ctx.restore(); 
    ctx.restore(); 
    
    if (e.bossPhase === 2 && Math.random() < 0.1 && !reduceFlashing) {
        ctx.fillStyle = '#fff';
        ctx.globalCompositeOperation = 'xor';
        ctx.fillRect(-20, -40, 40, 60);
    }

    ctx.restore(); 
};
