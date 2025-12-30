
import React, { useState } from 'react';
import { useGameState } from '../../game/useGameState';
import { DevIntent } from '../../game/intents/DevIntents';
import { EnemyType, CameraMode } from '../../types';
import { DevStartPanel } from './DevStartPanel';

export const DevTools: React.FC<{ game: ReturnType<typeof useGameState> }> = ({ game }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SPAWN' | 'CAMERA' | 'BOOT'>('GENERAL');
    
    // Toggle on Backtick (`)
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === '`') setIsOpen(prev => !prev);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    if (!isOpen) return null;

    const push = game.devHelper.queueDevIntent;

    return (
        <div className="absolute top-20 right-4 w-80 bg-black/90 border-2 border-red-900 z-[100] font-mono text-xs text-gray-300 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="bg-red-900/20 p-2 border-b border-red-900 flex justify-between items-center">
                <span className="font-bold text-red-500 tracking-widest">ENGINE_DEV_TOOLS</span>
                <div className="flex gap-2">
                    <button onClick={() => setIsOpen(false)} className="hover:text-white">[X]</button>
                </div>
            </div>

            <div className="flex border-b border-gray-800">
                {['GENERAL', 'SPAWN', 'CAMERA', 'BOOT'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-1 text-center hover:bg-gray-800 ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar">
                
                {/* ── BOOT TAB (NEW) ── */}
                {activeTab === 'BOOT' && (
                    <DevStartPanel game={game} />
                )}

                {/* ── GENERAL TAB ── */}
                {activeTab === 'GENERAL' && (
                    <>
                        <Section title="GAME STATE">
                            <ActionBtn label="ADD 500 XP" onClick={() => push({ type: 'DEV_GIVE_XP', amount: 500 })} />
                            <ActionBtn label="ADD 1000 SCORE" onClick={() => push({ type: 'DEV_GIVE_SCORE', amount: 1000 })} />
                            <ActionBtn label="UNLOCK COSMETICS" onClick={() => push({ type: 'DEV_UNLOCK_ALL_COSMETICS' })} />
                        </Section>
                        
                        <Section title="FLAGS">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={game.devModeFlagsRef.current.godMode} readOnly />
                                <ActionBtn label="TOGGLE GOD MODE" onClick={() => push({ type: 'DEV_TOGGLE_GOD_MODE' })} />
                            </div>
                        </Section>

                        <Section title="STAGE CONTROL">
                             <div className="grid grid-cols-4 gap-1">
                                {[1, 2, 3, 4, 5, 8, 10, 12].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => push({ type: 'DEV_FORCE_STAGE', stageId: s })}
                                        className="bg-gray-800 hover:bg-gray-700 text-center py-1 rounded"
                                    >
                                        {s}
                                    </button>
                                ))}
                             </div>
                        </Section>
                    </>
                )}

                {/* ── SPAWN TAB ── */}
                {activeTab === 'SPAWN' && (
                    <>
                        <Section title="ENEMIES">
                            <div className="grid grid-cols-2 gap-2">
                                <ActionBtn label="HUNTER" onClick={() => push({ type: 'DEV_SPAWN_ENEMY', enemyType: EnemyType.HUNTER })} />
                                <ActionBtn label="INTERCEPTOR" onClick={() => push({ type: 'DEV_SPAWN_ENEMY', enemyType: EnemyType.INTERCEPTOR })} />
                                <ActionBtn label="SHOOTER" onClick={() => push({ type: 'DEV_SPAWN_ENEMY', enemyType: EnemyType.SHOOTER })} />
                                <ActionBtn label="DASHER" onClick={() => push({ type: 'DEV_SPAWN_ENEMY', enemyType: EnemyType.DASHER })} />
                                <ActionBtn label="BOSS" onClick={() => push({ type: 'DEV_SPAWN_ENEMY', enemyType: EnemyType.BOSS })} />
                            </div>
                        </Section>
                        <Section title="TERMINALS">
                            <div className="grid grid-cols-2 gap-2">
                                <ActionBtn label="RESOURCE" onClick={() => push({ type: 'DEV_SPAWN_TERMINAL', terminalType: 'RESOURCE' })} />
                                <ActionBtn label="OVERRIDE" onClick={() => push({ type: 'DEV_SPAWN_TERMINAL', terminalType: 'OVERRIDE' })} />
                            </div>
                        </Section>
                        <Section title="CLEANUP">
                            <ActionBtn label="CLEAR ENEMIES" onClick={() => push({ type: 'DEV_CLEAR_ENEMIES' })} isDestructive />
                            <ActionBtn label="CLEAR FOOD" onClick={() => push({ type: 'DEV_CLEAR_FOOD' })} isDestructive />
                        </Section>
                    </>
                )}

                {/* ── CAMERA TAB ── */}
                {activeTab === 'CAMERA' && (
                    <>
                        <Section title="MODE">
                            <div className="flex gap-2">
                                <ActionBtn label="TOP DOWN" onClick={() => push({ type: 'DEV_SET_CAMERA_MODE', mode: CameraMode.TOP_DOWN })} />
                                <ActionBtn label="SIDE SCROLL" onClick={() => push({ type: 'DEV_SET_CAMERA_MODE', mode: CameraMode.SIDE_SCROLL })} />
                            </div>
                        </Section>
                        <Section title="ZOOM">
                            <div className="flex gap-2">
                                <ActionBtn label="0.5x" onClick={() => push({ type: 'DEV_SET_ZOOM', zoom: 0.5 })} />
                                <ActionBtn label="1.0x" onClick={() => push({ type: 'DEV_SET_ZOOM', zoom: 1.0 })} />
                                <ActionBtn label="1.5x" onClick={() => push({ type: 'DEV_SET_ZOOM', zoom: 1.5 })} />
                            </div>
                        </Section>
                    </>
                )}
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 pb-1">{title}</div>
        {children}
    </div>
);

const ActionBtn: React.FC<{ label: string; onClick: () => void; isDestructive?: boolean }> = ({ label, onClick, isDestructive }) => (
    <button 
        onClick={onClick}
        className={`w-full py-1.5 px-3 text-left border text-[10px] font-bold transition-colors ${
            isDestructive 
            ? 'border-red-900 text-red-500 hover:bg-red-900/20' 
            : 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
    >
        {label}
    </button>
);
