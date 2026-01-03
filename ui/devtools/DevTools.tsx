
import React, { useState, useEffect } from 'react';
import { useGameState } from '../../game/useGameState';
import { CHARACTERS } from '../../constants';
import { UpgradeId } from '../../upgrades/types';
import { CharacterProfile, WeaponStats, GameStatus, FoodType, Direction } from '../../types';
import { generateWalls, getRandomPos } from '../../game/gameUtils';

interface DevToolsProps {
    game: ReturnType<typeof useGameState>;
}

// Helper to access internals cleanly
const WEAPON_IDS: UpgradeId[] = [
    'CANNON', 'AURA', 'MINES', 'LIGHTNING', 'NANO_SWARM', 
    'PRISM_LANCE', 'NEON_SCATTER', 'VOLT_SERPENT', 'PHASE_RAIL'
];

const WEAPON_STAT_MAP: Record<string, keyof WeaponStats> = {
    'CANNON': 'cannonLevel', 'AURA': 'auraLevel', 'MINES': 'mineLevel',
    'LIGHTNING': 'chainLightningLevel', 'NANO_SWARM': 'nanoSwarmLevel',
    'PRISM_LANCE': 'prismLanceLevel', 'NEON_SCATTER': 'neonScatterLevel',
    'VOLT_SERPENT': 'voltSerpentLevel', 'PHASE_RAIL': 'phaseRailLevel'
};

export const DevTools: React.FC<DevToolsProps> = ({ game }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'CHAR' | 'LOADOUT' | 'STAGE'>('CHAR');
    
    // Toggle on Backtick
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '`') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    // ── ACTIONS ──

    const setCharacter = (char: CharacterProfile) => {
        game.setSelectedChar(char);
        game.resetGame(char);
        
        // Manual Init for Dev Warp
        game.wallsRef.current = generateWalls(1);
        
        // Spawn initial food
        const pos = getRandomPos(game.snakeRef.current, [], game.wallsRef.current);
        if (pos) {
            game.foodRef.current.push({
                x: pos.x, y: pos.y,
                type: FoodType.NORMAL,
                id: 'dev_init_food',
                createdAt: game.gameTimeRef.current
            });
        }
        
        game.setStatus(GameStatus.PLAYING);
    };

    const toggleWeapon = (id: UpgradeId) => {
        const stats = game.statsRef.current;
        const idx = stats.activeWeaponIds.indexOf(id);
        
        if (idx !== -1) {
            // Remove
            stats.activeWeaponIds.splice(idx, 1);
        } else {
            // Add
            if (stats.activeWeaponIds.length < stats.maxWeaponSlots) {
                stats.activeWeaponIds.push(id);
            } else {
                // Replace last slot if full
                stats.activeWeaponIds[stats.activeWeaponIds.length - 1] = id;
            }
            
            // Auto-set level 1 if 0 and initialize base stats
            const key = WEAPON_STAT_MAP[id];
            if (stats.weapon[key] === 0) {
                stats.weapon[key] = 1;
                
                // FORCE INIT BASE STATS (Fixes Aura/Mines not working when added via DevTools)
                if (id === 'AURA') {
                    stats.weapon.auraRadius = Math.max(stats.weapon.auraRadius, 2.5);
                    stats.weapon.auraDamage = Math.max(stats.weapon.auraDamage, 15);
                }
                else if (id === 'MINES') {
                    if (stats.weapon.mineDropRate === 0) stats.weapon.mineDropRate = 5000;
                    if (stats.weapon.mineRadius === 0) stats.weapon.mineRadius = 2.5;
                    if (stats.weapon.mineDamage === 0) stats.weapon.mineDamage = 50;
                }
                else if (id === 'LIGHTNING') {
                    if (stats.weapon.chainLightningRange === 0) stats.weapon.chainLightningRange = 8;
                    if (stats.weapon.chainLightningDamage === 0) stats.weapon.chainLightningDamage = 0.5;
                }
                else if (id === 'NANO_SWARM') {
                    if (stats.weapon.nanoSwarmCount === 0) stats.weapon.nanoSwarmCount = 1;
                    if (stats.weapon.nanoSwarmDamage === 0) stats.weapon.nanoSwarmDamage = 15;
                }
                else if (id === 'PRISM_LANCE') {
                    if (stats.weapon.prismLanceDamage === 0) stats.weapon.prismLanceDamage = 20;
                }
                else if (id === 'NEON_SCATTER') {
                    if (stats.weapon.neonScatterDamage === 0) stats.weapon.neonScatterDamage = 10;
                }
                else if (id === 'VOLT_SERPENT') {
                    if (stats.weapon.voltSerpentDamage === 0) stats.weapon.voltSerpentDamage = 25;
                }
                else if (id === 'PHASE_RAIL') {
                    if (stats.weapon.phaseRailDamage === 0) stats.weapon.phaseRailDamage = 80;
                }
            }
        }
        game.syncUiStats();
    };

    const setWeaponLevel = (id: UpgradeId, delta: number) => {
        const stats = game.statsRef.current;
        const key = WEAPON_STAT_MAP[id];
        if (!key) return;

        const current = stats.weapon[key];
        const next = Math.max(0, Math.min(10, current + delta));
        stats.weapon[key] = next;
        
        // Ensure stats scale if manually leveling up from 0 via buttons
        if (current === 0 && next === 1) {
             // Re-run init logic if going from 0 to 1
             if (id === 'AURA') {
                stats.weapon.auraRadius = Math.max(stats.weapon.auraRadius, 2.5);
                stats.weapon.auraDamage = Math.max(stats.weapon.auraDamage, 15);
            }
        }
        
        game.syncUiStats();
    };

    const clearLoadout = () => {
        const stats = game.statsRef.current;
        stats.activeWeaponIds = [];
        // Reset levels
        const keys = Object.keys(stats.weapon) as (keyof WeaponStats)[];
        keys.forEach(k => {
            if (typeof stats.weapon[k] === 'number') {
                stats.weapon[k] = 0;
            }
        });
        
        // Zero out derived stats to be safe
        stats.weapon.auraRadius = 0;
        stats.weapon.auraDamage = 0;
        stats.weapon.mineRadius = 0;
        
        game.syncUiStats();
    };

    const jumpToStage = (stage: number) => {
        // Logic Update
        game.stageRef.current = stage;
        game.setUiStage(stage);
        
        // Clean Entity Lists
        game.enemiesRef.current = [];
        game.foodRef.current = [];
        game.projectilesRef.current = [];
        game.terminalsRef.current = [];
        game.minesRef.current = [];
        game.shockwavesRef.current = [];
        game.particlesRef.current = [];
        game.lightningArcsRef.current = [];
        game.floatingTextsRef.current = [];
        
        // Reset Logic Flags
        game.bossActiveRef.current = false;
        game.setBossActive(false);
        game.stageReadyRef.current = false;
        game.stageArmedRef.current = true;
        game.pendingStatusRef.current = null;
        game.bossOverrideTimerRef.current = 0;

        // Generate Environment
        game.wallsRef.current = generateWalls(stage);

        // Reset Player Position (Safety)
        game.snakeRef.current = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        game.prevTailRef.current = { x: 7, y: 10 };
        game.directionRef.current = Direction.RIGHT;
        game.directionQueueRef.current = [];
        
        // Spawn Food
        const pos = getRandomPos(game.snakeRef.current, [], game.wallsRef.current);
        if (pos) {
            game.foodRef.current.push({
                x: pos.x, y: pos.y,
                type: FoodType.NORMAL,
                id: 'dev_jump_food',
                createdAt: game.gameTimeRef.current
            });
        }
        
        // Force Active State
        game.setStatus(GameStatus.PLAYING);
    };

    const toggleGodMode = () => {
        if (game.invulnerabilityTimeRef.current > 1000000) {
            game.invulnerabilityTimeRef.current = 0;
        } else {
            game.invulnerabilityTimeRef.current = 99999999;
        }
    };

    return (
        <div className="absolute top-10 left-10 w-80 bg-gray-900 border-2 border-cyan-500 z-[100] text-xs font-mono text-cyan-100 shadow-2xl">
            <div className="bg-cyan-900/50 p-2 flex justify-between items-center border-b border-cyan-500">
                <span className="font-bold">DEV_TOOLS // OMEGA</span>
                <button onClick={() => setIsVisible(false)} className="hover:text-white">[X]</button>
            </div>

            <div className="flex border-b border-gray-700">
                <button onClick={() => setActiveTab('CHAR')} className={`flex-1 py-2 ${activeTab === 'CHAR' ? 'bg-cyan-800' : 'hover:bg-gray-800'}`}>CHAR</button>
                <button onClick={() => setActiveTab('LOADOUT')} className={`flex-1 py-2 ${activeTab === 'LOADOUT' ? 'bg-cyan-800' : 'hover:bg-gray-800'}`}>LOADOUT</button>
                <button onClick={() => setActiveTab('STAGE')} className={`flex-1 py-2 ${activeTab === 'STAGE' ? 'bg-cyan-800' : 'hover:bg-gray-800'}`}>STAGE</button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                
                {activeTab === 'CHAR' && (
                    <div className="space-y-2">
                        <div className="font-bold text-cyan-500">SELECT OPERATOR</div>
                        <div className="grid grid-cols-2 gap-2">
                            {CHARACTERS.map(char => (
                                <button 
                                    key={char.id}
                                    onClick={() => setCharacter(char)}
                                    className="p-2 border border-gray-600 hover:bg-cyan-900/30 text-left"
                                >
                                    {char.name}
                                </button>
                            ))}
                        </div>
                        
                        <div className="font-bold text-cyan-500 mt-4">CHEATS</div>
                        <button 
                            onClick={toggleGodMode}
                            className="w-full p-2 border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                        >
                            TOGGLE GOD MODE (INVULN)
                        </button>
                    </div>
                )}

                {activeTab === 'LOADOUT' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                            <span className="font-bold text-cyan-500">ACTIVE WEAPONS ({game.uiStats.activeWeapons.length}/{game.uiStats.maxWeaponSlots})</span>
                            <button 
                                onClick={clearLoadout}
                                className="text-[10px] text-red-400 hover:text-red-300 border border-red-900 px-2 rounded"
                            >
                                RESET
                            </button>
                        </div>

                        <div className="space-y-1">
                            {WEAPON_IDS.map(id => {
                                const isActive = game.uiStats.activeWeapons.includes(id);
                                const level = game.uiStats.weaponLevels[id] || 0;

                                return (
                                    <div key={id} className={`flex items-center gap-2 p-1 rounded ${isActive ? 'bg-cyan-900/30' : 'bg-gray-800/50'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={isActive} 
                                            onChange={() => toggleWeapon(id)}
                                            className="cursor-pointer"
                                        />
                                        <div className={`flex-1 ${isActive ? 'text-cyan-300 font-bold' : 'text-gray-500'}`}>
                                            {id}
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => setWeaponLevel(id, -1)}
                                                className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
                                            >-</button>
                                            <span className="w-6 text-center font-mono">{level}</span>
                                            <button 
                                                onClick={() => setWeaponLevel(id, 1)}
                                                className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
                                            >+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-4 pt-2 border-t border-gray-700">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-400">Max Slots</span>
                                <div className="flex gap-1">
                                    <button onClick={() => {
                                        game.statsRef.current.maxWeaponSlots = Math.max(1, game.statsRef.current.maxWeaponSlots - 1);
                                        game.syncUiStats();
                                    }} className="px-2 bg-gray-700">-</button>
                                    <span>{game.uiStats.maxWeaponSlots}</span>
                                    <button onClick={() => {
                                        game.statsRef.current.maxWeaponSlots = Math.min(8, game.statsRef.current.maxWeaponSlots + 1);
                                        game.syncUiStats();
                                    }} className="px-2 bg-gray-700">+</button>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'STAGE' && (
                    <div className="space-y-2">
                        <div className="font-bold text-cyan-500">WARP TO SECTOR</div>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 8, 10, 12, 15, 20].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => jumpToStage(s)}
                                    className="p-2 border border-gray-600 hover:bg-cyan-900/30 text-center"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">
                            Note: Hard Warp. Resets enemies and layout.
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
