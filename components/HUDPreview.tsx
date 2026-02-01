
import React from 'react';
import { GameHUDView } from '../ui/hud/GameHUD';
import { HUDData, HUDLayoutMode } from '../ui/hud/types';
import { GameStatus, Difficulty } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

const MOCK_DATA: HUDData = {
    status: GameStatus.PLAYING,
    headPosition: { x: 20, y: 15 },
    score: { current: 24500, high: 50000, combo: 6 },
    threat: { label: 'HIGH', colorClass: 'text-orange-500', level: Difficulty.HARD },
    progression: { level: 8, xp: 65, xpMax: 100, stage: 5, stageLabel: 'IN PROGRESS' },
    vitals: { integrity: 72, shieldActive: true, stamina: 100 },
    metrics: { damage: 150, fireRate: 1200, range: 18, crit: 25 },
    loadout: {
        weapons: [
            { id: 'CANNON', level: 3, cooldownPct: 1, active: true, icon: '🔫', description: 'Auto Cannon' },
            { id: 'MINES', level: 2, cooldownPct: 0.4, active: true, icon: '💣', description: 'Mines' },
            { id: 'AURA', level: 1, cooldownPct: 1, active: true, icon: '⭕', description: 'Aura' }
        ],
        utilities: [
            { id: 'SHIELD', level: 1, cooldownPct: 0, active: true, icon: '🛡️', description: 'Shield' }
        ],
        maxWeaponSlots: 3
    },
    visibility: { showScore: true, showWeapons: true, showMetrics: true, showControls: true }
};

interface HUDPreviewProps {
    layoutId: string;
    width?: number; // Optional container width for scaling
    height?: number;
}

export const HUDPreview: React.FC<HUDPreviewProps> = ({ layoutId, width = 384, height = 300 }) => {
    // Config for the specific layout being previewed
    const config = {
        layout: layoutId as HUDLayoutMode,
        numberStyle: 'DIGITAL',
        theme: 'NEON',
        showAnimations: true,
        opacity: 1.0,
        visible: true,
        autoHide: false
    } as const;

    // Calculate scale based on provided width vs Canvas Width
    const scale = width / CANVAS_WIDTH; 

    return (
        <div className="relative overflow-hidden flex items-start justify-center bg-black/50 border border-gray-800 rounded" style={{ width, height }}>
             <div 
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top left', 
                    width: CANVAS_WIDTH, 
                    height: CANVAS_HEIGHT,
                    // Prevent squishing, ensure aspect ratio is maintained
                    flexShrink: 0
                }}
             >
                 {/* Fake Game Background for Context */}
                 <div className="absolute inset-0 bg-[#050a10]">
                     {/* Grid */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
                     
                     {/* Dummy Entities */}
                     <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-cyan-400 shadow-[0_0_10px_cyan] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                     <div className="absolute top-1/3 left-1/3 w-6 h-6 bg-red-500 shadow-[0_0_15px_red] rounded-full" />
                 </div>

                 {/* The HUD View */}
                 <GameHUDView data={MOCK_DATA} config={config} showUI={true} />
             </div>
        </div>
    );
};
