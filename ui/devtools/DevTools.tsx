
import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../../game/useGameState';
import { useSpawner } from '../../game/useSpawner';
import { useFX } from '../../game/useFX';
import { useProgression } from '../../game/useProgression';
import { CHARACTERS, DIFFICULTY_CONFIGS, UPGRADE_BASES } from '../../constants';
import { UpgradeId } from '../../upgrades/types';
import { CharacterProfile, WeaponStats, GameStatus, FoodType, Direction, EnemyType, TerminalType, Difficulty } from '../../types';
import { generateWalls, getRandomPos } from '../../game/gameUtils';
import { runSpawnerUnitTests } from '../../game/tests/SpawnerUnitTests';
import { COSMETIC_REGISTRY } from '../../game/cosmetics/CosmeticRegistry';
import { audio } from '../../utils/audio';
import { applyWeaponGrowth } from '../../game/weaponScaling';

interface DevToolsProps {
    game: ReturnType<typeof useGameState>;
    advanceStage?: () => void;
}

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

export const DevTools: React.FC<DevToolsProps> = ({ game, advanceStage }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'PLAYER' | 'WORLD' | 'SYS' | 'DEBUG'>('PLAYER');
    const [testResults, setTestResults] = useState<string[]>([]);
    
    // Window State
    const [pos, setPos] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    
    // Tools State
    const [animateStage, setAnimateStage] = useState(true);
    const [warpTarget, setWarpTarget] = useState(1);
    const [forceUpdate, setForceUpdate] = useState(0); // Trigger re-render for ref changes

    // Hooks
    const spawner = useSpawner(game, (x, y) => {}); // Mock shake
    const fx = useFX(game);
    const progression = useProgression(game);

    // ─── KEYBOARD LISTENERS ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '`') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ─── DRAG LOGIC ───
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPos({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const startDrag = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    };

    if (!isVisible) return null;

    // ─── HELPERS ───

    const resetWeaponStats = (id: string, stats: any) => {
        switch(id) {
            case 'CANNON': 
                stats.cannonLevel = 0; stats.cannonDamage = 0; stats.cannonFireRate = 0; stats.cannonProjectileCount = 0; break;
            case 'AURA': 
                stats.auraLevel = 0; stats.auraDamage = 0; stats.auraRadius = 0; break;
            case 'MINES': 
                stats.mineLevel = 0; stats.mineDamage = 0; stats.mineDropRate = 0; stats.mineRadius = 0; break;
            case 'LIGHTNING': 
                stats.chainLightningLevel = 0; stats.chainLightningDamage = 0; stats.chainLightningRange = 0; break;
            case 'NANO_SWARM': 
                stats.nanoSwarmLevel = 0; stats.nanoSwarmDamage = 0; stats.nanoSwarmCount = 0; break;
            case 'PRISM_LANCE': 
                stats.prismLanceLevel = 0; stats.prismLanceDamage = 0; break;
            case 'NEON_SCATTER': 
                stats.neonScatterLevel = 0; stats.neonScatterDamage = 0; break;
            case 'VOLT_SERPENT': 
                stats.voltSerpentLevel = 0; stats.voltSerpentDamage = 0; break;
            case 'PHASE_RAIL': 
                stats.phaseRailLevel = 0; stats.phaseRailDamage = 0; break;
        }
    };

    const initWeaponStats = (id: string, stats: any) => {
        switch(id) {
            case 'CANNON': 
                stats.cannonLevel = 1; stats.cannonDamage = UPGRADE_BASES.CANNON_DMG; stats.cannonFireRate = UPGRADE_BASES.CANNON_FIRE_RATE; stats.cannonProjectileCount = 1; break;
            case 'AURA': 
                stats.auraLevel = 1; stats.auraDamage = UPGRADE_BASES.AURA_DMG; stats.auraRadius = UPGRADE_BASES.AURA_RADIUS; break;
            case 'MINES': 
                stats.mineLevel = 1; stats.mineDamage = UPGRADE_BASES.MINE_DMG; stats.mineDropRate = UPGRADE_BASES.MINE_RATE; stats.mineRadius = 2.5; break;
            case 'LIGHTNING': 
                stats.chainLightningLevel = 1; stats.chainLightningDamage = UPGRADE_BASES.LIGHTNING_DMG; stats.chainLightningRange = UPGRADE_BASES.LIGHTNING_RANGE; break;
            case 'NANO_SWARM': 
                stats.nanoSwarmLevel = 1; stats.nanoSwarmDamage = UPGRADE_BASES.NANO_DMG; stats.nanoSwarmCount = 1; break;
            case 'PRISM_LANCE': 
                stats.prismLanceLevel = 1; stats.prismLanceDamage = UPGRADE_BASES.PRISM_DMG; break;
            case 'NEON_SCATTER': 
                stats.neonScatterLevel = 1; stats.neonScatterDamage = UPGRADE_BASES.SCATTER_DMG; break;
            case 'VOLT_SERPENT': 
                stats.voltSerpentLevel = 1; stats.voltSerpentDamage = UPGRADE_BASES.SERPENT_DMG; break;
            case 'PHASE_RAIL': 
                stats.phaseRailLevel = 1; stats.phaseRailDamage = UPGRADE_BASES.RAIL_DMG; break;
        }
    };

    // ─── ACTIONS ───

    const setWeaponLevel = (id: UpgradeId, targetLevel: number) => {
        const stats = game.statsRef.current;
        const key = WEAPON_STAT_MAP[id];
        if (!key) return;

        const currentLevel = stats.weapon[key] || 0;
        
        if (targetLevel > currentLevel) {
            // Initialization Logic (0 -> 1)
            if (currentLevel === 0) {
                initWeaponStats(id, stats.weapon);
                if (!stats.activeWeaponIds.includes(id)) {
                    stats.activeWeaponIds.push(id);
                }
                
                // Grow to target if > 1
                for(let i=1; i < targetLevel; i++) {
                    applyWeaponGrowth(stats.weapon, id, 'COMMON');
                }
            } else {
                // Standard Growth
                for(let i=currentLevel; i < targetLevel; i++) {
                    applyWeaponGrowth(stats.weapon, id, 'COMMON');
                }
            }
        } else if (targetLevel < currentLevel) {
            // Downgrade: Reset and Re-grow
            resetWeaponStats(id, stats.weapon);
            
            // Remove from active if 0
            if (targetLevel <= 0) {
                const idx = stats.activeWeaponIds.indexOf(id);
                if (idx !== -1) stats.activeWeaponIds.splice(idx, 1);
            } else {
                 // Initialize at 1
                 initWeaponStats(id, stats.weapon);
                 if (!stats.activeWeaponIds.includes(id)) stats.activeWeaponIds.push(id);
                 
                 // Grow to target
                 for(let i=1; i < targetLevel; i++) {
                     applyWeaponGrowth(stats.weapon, id, 'COMMON');
                 }
            }
        }
        
        game.syncUiStats();
        setForceUpdate(prev => prev + 1);
    };

    const setCharacter = (char: CharacterProfile) => {
        game.setSelectedChar(char);
        game.resetGame(char);
        game.wallsRef.current = generateWalls(1, game.viewport.cols, game.viewport.rows);
        const pos = getRandomPos(game.snakeRef.current, [], game.wallsRef.current, game.viewport.cols, game.viewport.rows);
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

    const handleForceNextStage = () => {
        if (animateStage) {
             game.transitionStartTimeRef.current = game.gameTimeRef.current;
             game.setStatus(GameStatus.STAGE_TRANSITION);
        } else {
            if (advanceStage) {
                advanceStage();
            }
        }
    };

    const warpToStage = (stage: number) => {
        // Update Refs
        game.stageRef.current = stage;
        
        // Update UI
        game.setUiStage(stage);
        game.setUiStageStatus('WARP');

        // Cleanup Entities
        game.enemiesRef.current = [];
        game.foodRef.current = [];
        game.projectilesRef.current = [];
        game.terminalsRef.current = [];
        game.minesRef.current = [];
        game.shockwavesRef.current = [];
        game.particlesRef.current = [];
        game.floatingTextsRef.current = [];
        
        // Reset Logic
        game.bossActiveRef.current = false;
        game.setBossActive(false);
        game.stageReadyRef.current = false;
        game.stageArmedRef.current = true;
        game.bossOverrideTimerRef.current = 0;
        game.bossDefeatedRef.current = false;
        
        // Generate Walls
        game.wallsRef.current = generateWalls(stage, game.viewport.cols, game.viewport.rows);

        // Reset Snake Pos to safe start
        game.snakeRef.current = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        game.prevTailRef.current = { x: 7, y: 10 };
        game.directionRef.current = Direction.RIGHT;
        game.directionQueueRef.current = [];
        
        // Spawn starter food
        spawner.spawnFood();
        
        game.setStatus(GameStatus.PLAYING);
        audio.play('CLI_BURST');
    };

    const toggleGodMode = () => {
        game.debugFlagsRef.current.godMode = !game.debugFlagsRef.current.godMode;
        setForceUpdate(prev => prev + 1);
    };

    const toggleHitboxes = () => {
        game.debugFlagsRef.current.showHitboxes = !game.debugFlagsRef.current.showHitboxes;
        setForceUpdate(prev => prev + 1);
    };

    const togglePathing = () => {
        game.debugFlagsRef.current.showPathing = !game.debugFlagsRef.current.showPathing;
        setForceUpdate(prev => prev + 1);
    };
    
    const killAllEnemies = () => {
        game.enemiesRef.current.forEach(e => {
            e.hp = 0;
            // Let combat loop handle removal and rewards
        });
    };

    const healPlayer = () => {
        game.tailIntegrityRef.current = 100;
        game.setUiShield(true);
        game.statsRef.current.shieldActive = true;
    };

    const addCurrency = () => {
        game.addNeonFragments(1000);
    };

    const unlockAllCosmetics = () => {
        Object.keys(COSMETIC_REGISTRY).forEach(id => {
            game.unlockCosmetic(id);
        });
    };

    const setDifficulty = (diff: Difficulty) => {
        game.setDifficulty(diff);
        audio.play('UI_HARD_CLICK');
    };

    return (
        <div 
            className="fixed w-96 bg-[#0a0a0a] border border-cyan-900/50 shadow-2xl z-[9999] text-xs font-mono text-cyan-50 flex flex-col rounded-md overflow-hidden"
            style={{ left: pos.x, top: pos.y, maxHeight: '80vh' }}
        >
            {/* Header */}
            <div 
                className="bg-cyan-950/30 p-2 border-b border-cyan-900/50 flex justify-between items-center cursor-move select-none"
                onMouseDown={startDrag}
            >
                <span className="font-bold tracking-widest text-cyan-400">DEV_CONSOLE // OMEGA</span>
                <button onClick={() => setIsVisible(false)} className="hover:text-white px-2">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#050505] border-b border-cyan-900/30">
                {(['PLAYER', 'WORLD', 'SYS', 'DEBUG'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-center transition-colors ${activeTab === tab ? 'bg-cyan-900/20 text-cyan-300 font-bold border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#080808]">
                
                {/* ── PLAYER TOOLS ── */}
                {activeTab === 'PLAYER' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={toggleGodMode}
                                className={`p-2 border rounded ${game.debugFlagsRef.current.godMode ? 'bg-yellow-900/30 border-yellow-500 text-yellow-300' : 'border-gray-700 hover:bg-gray-800'}`}
                            >
                                GOD MODE {game.debugFlagsRef.current.godMode ? '[ON]' : '[OFF]'}
                            </button>
                            <button onClick={healPlayer} className="p-2 border border-green-700 bg-green-900/20 hover:bg-green-900/40 text-green-300 rounded">
                                FULL HEAL
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={addCurrency} className="p-2 border border-cyan-700 hover:bg-cyan-900/20 rounded">
                                +1000 NF
                            </button>
                            <button onClick={unlockAllCosmetics} className="p-2 border border-purple-700 hover:bg-purple-900/20 rounded">
                                UNLOCK ALL
                            </button>
                        </div>

                        {/* Weapon Levels */}
                        <div className="bg-[#111] p-2 border border-gray-800 rounded">
                            <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase border-b border-gray-800 pb-1">Weapon Override</div>
                            <div className="space-y-1">
                                {WEAPON_IDS.map(id => {
                                    const key = WEAPON_STAT_MAP[id];
                                    const level = game.statsRef.current.weapon[key] || 0;
                                    return (
                                        <div key={id} className="flex items-center justify-between p-1 hover:bg-gray-900 rounded">
                                            <span className={`text-[10px] w-24 truncate ${level > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>{id}</span>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => setWeaponLevel(id, level - 1)}
                                                    className="w-5 h-5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded flex items-center justify-center border border-gray-700"
                                                >-</button>
                                                <span className="text-[10px] w-5 text-center font-mono text-white bg-black rounded border border-gray-800">{level}</span>
                                                <button 
                                                    onClick={() => setWeaponLevel(id, level + 1)}
                                                    className="w-5 h-5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded flex items-center justify-center border border-gray-700"
                                                >+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-gray-500 font-bold mb-2">OPERATOR SELECT</div>
                            <div className="grid grid-cols-3 gap-1">
                                {CHARACTERS.map(char => (
                                    <button 
                                        key={char.id}
                                        onClick={() => setCharacter(char)}
                                        className="p-1 text-[10px] border border-gray-700 hover:bg-white/10 rounded truncate"
                                        title={char.name}
                                    >
                                        {char.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── WORLD TOOLS ── */}
                {activeTab === 'WORLD' && (
                    <div className="space-y-4">
                        
                        {/* DIFFICULTY SELECTOR */}
                        <div className="bg-[#111] p-3 rounded border border-gray-800">
                            <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Difficulty Override</div>
                            <div className="grid grid-cols-2 gap-1">
                                {Object.values(DIFFICULTY_CONFIGS).map(diff => (
                                    <button 
                                        key={diff.id}
                                        onClick={() => setDifficulty(diff.id)}
                                        className={`
                                            p-1 text-[10px] font-bold border rounded uppercase transition-colors
                                            ${game.difficulty === diff.id ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}
                                        `}
                                    >
                                        {diff.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* STAGE CONTROLS */}
                        <div className="bg-[#111] p-3 rounded border border-gray-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-cyan-500">STAGE CONTROL</span>
                                <span className="text-[10px] text-gray-500">Current: {game.stageRef.current}</span>
                            </div>
                            
                            <button 
                                onClick={handleForceNextStage}
                                className="w-full p-2 bg-cyan-900/30 border border-cyan-500 hover:bg-cyan-900/50 text-cyan-200 rounded font-bold mb-2"
                            >
                                FORCE NEXT (+1)
                            </button>
                            
                            <div className="flex items-center gap-2 mb-2">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    value={warpTarget}
                                    onChange={(e) => setWarpTarget(parseInt(e.target.value) || 1)}
                                    className="bg-black border border-gray-700 text-white p-1 w-16 text-center rounded"
                                />
                                <button 
                                    onClick={() => warpToStage(warpTarget)}
                                    className="flex-1 p-1 bg-purple-900/30 border border-purple-500 hover:bg-purple-900/50 text-purple-200 rounded font-bold"
                                >
                                    WARP TO STAGE
                                </button>
                            </div>

                            <label className="flex items-center gap-2 text-[10px] cursor-pointer text-gray-400">
                                <input 
                                    type="checkbox" 
                                    checked={animateStage} 
                                    onChange={(e) => setAnimateStage(e.target.checked)}
                                    className="accent-cyan-500"
                                />
                                Animate Transition (Next Only)
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={killAllEnemies} className="p-2 border border-red-800 bg-red-950/20 text-red-400 rounded hover:bg-red-900/40">
                                NUKE ENEMIES
                            </button>
                            <button onClick={() => spawner.spawnEnemy(EnemyType.BOSS)} className="p-2 border border-orange-800 bg-orange-950/20 text-orange-400 rounded hover:bg-orange-900/40">
                                SPAWN BOSS
                            </button>
                        </div>
                        
                        <div>
                             <div className="text-[10px] text-gray-500 font-bold mb-2">SPAWN ENTITY</div>
                             <div className="grid grid-cols-3 gap-1">
                                 {Object.values(EnemyType).filter(t => t !== 'BOSS').map(t => (
                                     <button key={t} onClick={() => spawner.spawnEnemy(t)} className="p-1 border border-gray-700 text-[9px] hover:bg-white/10 rounded">
                                         + {t}
                                     </button>
                                 ))}
                                 <button onClick={() => spawner.spawnTerminal()} className="p-1 border border-blue-900 text-blue-300 text-[9px] hover:bg-blue-900/20 rounded">+ TERM</button>
                                 <button onClick={() => spawner.spawnXpOrbs(20, 20, 1000)} className="p-1 border border-green-900 text-green-300 text-[9px] hover:bg-green-900/20 rounded">+ XP</button>
                             </div>
                        </div>
                    </div>
                )}

                {/* ── SYS TOOLS ── */}
                {activeTab === 'SYS' && (
                    <div className="space-y-4">
                         <div className="flex flex-col gap-2">
                             <label className="flex items-center justify-between p-2 bg-[#111] rounded border border-gray-800">
                                 <span>Show Hitboxes</span>
                                 <input type="checkbox" checked={game.debugFlagsRef.current.showHitboxes} onChange={toggleHitboxes} className="accent-cyan-500"/>
                             </label>
                             <label className="flex items-center justify-between p-2 bg-[#111] rounded border border-gray-800">
                                 <span>Show Pathing Grid</span>
                                 <input type="checkbox" checked={game.debugFlagsRef.current.showPathing} onChange={togglePathing} className="accent-cyan-500"/>
                             </label>
                             <label className="flex items-center justify-between p-2 bg-[#111] rounded border border-gray-800">
                                 <span>Disable Spawning</span>
                                 <input 
                                    type="checkbox" 
                                    checked={game.debugFlagsRef.current.disableSpawning} 
                                    onChange={() => {
                                        game.debugFlagsRef.current.disableSpawning = !game.debugFlagsRef.current.disableSpawning;
                                        setForceUpdate(p => p+1);
                                    }} 
                                    className="accent-cyan-500"
                                />
                             </label>
                         </div>
                    </div>
                )}
                
                {/* ── DEBUG/TESTS ── */}
                {activeTab === 'DEBUG' && (
                    <div className="space-y-4">
                         <button onClick={() => setTestResults(runSpawnerUnitTests())} className="w-full p-2 bg-blue-900/20 border border-blue-600 text-blue-300 text-xs rounded">
                             RUN UNIT TESTS
                         </button>
                         <div className="bg-black p-2 border border-gray-800 h-40 overflow-y-auto font-mono text-[10px]">
                            {testResults.length === 0 ? <span className="text-gray-600">No results...</span> : (
                                testResults.map((line, i) => (
                                    <div key={i} className={line.includes('[FAIL]') ? 'text-red-400' : 'text-green-400'}>
                                        {line}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
