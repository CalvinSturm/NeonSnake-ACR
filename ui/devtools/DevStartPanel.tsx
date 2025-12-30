
import React, { useState } from 'react';
import { DEV_START_CONFIG } from '../../game/dev/DevStartConfig';
import { CHARACTERS } from '../../constants';
import { Difficulty } from '../../types';
import { useGameState } from '../../game/useGameState';
import { audio } from '../../utils/audio';

export const DevStartPanel: React.FC<{ game: ReturnType<typeof useGameState> }> = ({ game }) => {
    // Local state for the form (mirroring the config)
    const [charId, setCharId] = useState(DEV_START_CONFIG.characterId || 'striker');
    const [stageId, setStageId] = useState(DEV_START_CONFIG.stageId || 1);
    const [difficulty, setDifficulty] = useState<Difficulty>(DEV_START_CONFIG.difficulty || Difficulty.EASY);
    
    // Mods
    const [godMode, setGodMode] = useState(DEV_START_CONFIG.mods?.godMode || false);
    const [freeMove, setFreeMove] = useState(DEV_START_CONFIG.mods?.freeMovement || false);

    const handleApplyAndRestart = () => {
        // 1. Commit to Config
        DEV_START_CONFIG.enabled = true;
        DEV_START_CONFIG.characterId = charId;
        DEV_START_CONFIG.stageId = stageId;
        DEV_START_CONFIG.difficulty = difficulty;
        
        DEV_START_CONFIG.mods = {
            godMode,
            freeMovement: freeMove
        };
        
        // 2. Queue Intent
        game.devHelper.queueDevIntent({ type: 'RESET_GAME' });
        
        // 3. Force Wake (if in menu/idle loop might not be running)
        // Check if we are IDLE. If so, we need to manually trigger the reset via a helper
        // because the game loop (which consumes intents) might be paused.
        // However, we can just start the loop by setting status.
        if (game.status === 'IDLE' || game.status === 'GAME_OVER' || game.status === 'PAUSED') {
             // Forcing status to PLAYING will start the loop, which will then consume the RESET_GAME intent
             // in the first frame.
             game.setStatus('PLAYING' as any);
        }
        
        audio.play('UI_HARD_CLICK');
    };

    return (
        <div className="space-y-4 p-2">
            <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold block uppercase">Character Profile</label>
                <select 
                    value={charId} 
                    onChange={(e) => setCharId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs p-1"
                >
                    {CHARACTERS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold block uppercase">Stage ID</label>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={stageId}
                        onChange={(e) => setStageId(parseInt(e.target.value))}
                        className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 text-xs p-1"
                    />
                    <div className="text-[9px] text-gray-600 self-center">1-20</div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold block uppercase">Difficulty</label>
                <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs p-1"
                >
                    <option value={Difficulty.EASY}>NEOPHYTE</option>
                    <option value={Difficulty.MEDIUM}>OPERATOR</option>
                    <option value={Difficulty.HARD}>VETERAN</option>
                    <option value={Difficulty.INSANE}>CYBERPSYCHO</option>
                </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={godMode} onChange={(e) => setGodMode(e.target.checked)} />
                    <span className="text-gray-400">God Mode</span>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={freeMove} onChange={(e) => setFreeMove(e.target.checked)} />
                    <span className="text-gray-400">Free Movement (No Gravity)</span>
                </div>
            </div>

            <div className="pt-4">
                <button 
                    onClick={handleApplyAndRestart}
                    className="w-full bg-red-900 hover:bg-red-700 text-white font-bold py-2 border border-red-500 text-xs tracking-wider"
                >
                    APPLY & RESTART
                </button>
            </div>
        </div>
    );
};
