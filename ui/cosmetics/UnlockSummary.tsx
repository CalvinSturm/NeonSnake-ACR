
import React from 'react';
import { COSMETIC_REGISTRY } from '../../game/cosmetics/CosmeticRegistry';
import { UserSettings } from '../../game/useGameState';

interface UnlockSummaryProps {
    newIds: string[];
    onClose: () => void;
}

export const UnlockSummary: React.FC<UnlockSummaryProps> = ({ newIds, onClose }) => {
    if (newIds.length === 0) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="w-full max-w-2xl p-8 border-y-2 border-cyan-500 bg-cyan-950/20 text-center relative overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,255,255,0.03)_10px,rgba(0,255,255,0.03)_20px)] pointer-events-none" />
                
                <h2 className="text-3xl font-display font-bold text-cyan-400 mb-2 tracking-widest">
                    SYSTEM REWARDS
                </h2>
                <p className="text-gray-400 font-mono text-sm mb-8">
                    New protocols decrypted from this session.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {newIds.map(id => {
                        const def = COSMETIC_REGISTRY[id];
                        if (!def) return null;
                        return (
                            <div key={id} className="bg-black/60 border border-gray-700 p-4 rounded flex flex-col items-center group hover:border-cyan-500 transition-colors">
                                <div className="text-[10px] bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded mb-2 uppercase">
                                    {def.type}
                                </div>
                                <div className="text-xl font-bold text-white mb-1">{def.displayName}</div>
                                <div className="text-xs text-gray-500">{def.description}</div>
                            </div>
                        );
                    })}
                </div>

                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
                >
                    ACKNOWLEDGE
                </button>
            </div>
        </div>
    );
};
