
import { Enemy } from '../../../types';
import { drawShadow } from '../primitives';

export const renderWarden = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    now: number,
    gridSize: number
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
    // We render the boss facing Right by default
    ctx.scale(facing, 1);

    // 1. Shadow
    ctx.save();
    ctx.translate(0, 20); // Floor offset
    drawShadow(ctx, 0, 0, 15, 8);
    ctx.restore();

    // 2. Body (Heavy Armor)
    const bodyW = 20;
    const bodyH = 30;
    
    // Crouch during recovery
    const squat = isRecovery ? 10 : 0;

    // Legs
    ctx.fillStyle = '#111';
    ctx.fillRect(-10, 0, 8, 20); // Back Leg
    ctx.fillRect(2, 0, 8, 20);   // Front Leg
    
    // Torso
    ctx.fillStyle = '#222';
    ctx.fillRect(-bodyW/2, -bodyH + squat, bodyW, bodyH);
    
    // Core Light
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(-4, -bodyH + 5 + squat, 8, 8);
    ctx.shadowBlur = 0;

    // 3. Head
    ctx.fillStyle = '#333';
    ctx.fillRect(-6, -bodyH - 10 + squat, 12, 10);
    // Eye
    ctx.fillStyle = '#0ff';
    ctx.fillRect(2, -bodyH - 6 + squat, 4, 2);

    // 4. Weapon (Greatsword)
    ctx.save();
    ctx.translate(0, -10 + squat); // Shoulder pivot
    
    let armRot = 0;
    let swordRot = 0;
    
    if (isSweep) {
        if (isTelegraph) {
            armRot = -2.5; // Back swing
            swordRot = -1.0;
        } else if (isExecute) {
            armRot = 1.0; // Forward swing
            swordRot = 1.5;
        } else if (isRecovery) {
            armRot = 0.8;
            swordRot = 2.0; // Dragging
        } else {
            // Idle Sweep stance
            armRot = -0.5;
        }
    } else {
        // Overhead
        if (isTelegraph) {
            armRot = -0.5; // Raised high
            swordRot = -1.5; // Pointing back
        } else if (isExecute) {
            armRot = 2.0; // Slammed down
            swordRot = 1.5;
        } else if (isRecovery) {
            armRot = 1.8; // Stuck in ground
            swordRot = 1.8;
        }
    }

    ctx.rotate(armRot);
    
    // Arm
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -4, 20, 8);
    
    // Weapon Pivot (Hand)
    ctx.translate(20, 0);
    ctx.rotate(swordRot);
    
    // Sword
    const swordL = 60;
    const swordW = 8;
    
    ctx.fillStyle = isExecute ? '#fff' : '#666'; // Flash white on hit
    if (isExecute) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -swordW/2);
    ctx.lineTo(swordL, 0);
    ctx.lineTo(0, swordW/2);
    ctx.lineTo(-10, 0);
    ctx.fill();

    ctx.restore(); // Restore Weapon
    
    // Glitch / Phase Shift Effect (Phase 2)
    if (e.bossPhase === 2 && Math.random() < 0.1) {
        ctx.fillStyle = '#fff';
        ctx.globalCompositeOperation = 'xor';
        ctx.fillRect(-20, -40, 40, 60);
    }

    ctx.restore(); // Restore Facing
};
