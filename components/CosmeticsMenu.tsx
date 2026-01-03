
import React, { useState, useMemo } from 'react';
import { useGameState } from '../game/useGameState';
import { COSMETIC_REGISTRY, CosmeticDef, CosmeticType } from '../game/cosmetics/CosmeticRegistry';
import { HUDLayoutMode } from '../ui/hud/types';
import { SnakePreview } from './SnakePreview';
import { HUDPreview } from './HUDPreview';
import { audio } from '../utils/audio';

interface CosmeticsMenuProps {
    onClose: () => void;
}

const TIER_COLORS = {
    1: 'border-green-500/30 text-green-500',
    2: 'border-cyan-500/30 text-cyan-500',
    3: 'border-orange-500/30 text-orange-500',
    4: 'border-red-500/30 text-red-500'
};

const TIER_NAMES = {
    1: 'NEOPHYTE',
    2: 'OPERATOR',
    3: 'VETERAN',
    4: 'CYBERPSYCHO'
};

export const CosmeticsMenu: React.FC<CosmeticsMenuProps> = ({ onClose }) => {
    const { settings, setSettings, unlockedCosmetics, purchasedCosmetics, seenCosmetics, markCosmeticSeen, neonFragments, purchaseCosmetic } = useGameState();
    const [activeTab, setActiveTab] = useState<CosmeticType>('SKIN');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    // Initial load: determine what to show as "current" selection based on active settings
    const currentSkin = settings.snakeStyle;
    
    // Group cosmetics by Tier
    const tieredItems = useMemo(() => {
        const filtered = Object.values(COSMETIC_REGISTRY).filter(c => c.type === activeTab);
        const groups: Record<number, CosmeticDef[]> = { 1: [], 2: [], 3: [], 4: [] };
        
        filtered.forEach(item => {
            if (groups[item.tier]) groups[item.tier].push(item);
        });
        
        // Sort within tiers
        Object.keys(groups).forEach(k => {
            const key = Number(k);
            groups[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
        });

        return groups;
    }, [activeTab]);

    // Handle Selection (Previewing)
    const handleSelect = (id: string) => {
        setSelectedId(id);
        setPurchaseError(null);
        audio.play('MOVE');
        // Mark as seen immediately upon interaction
        if (unlockedCosmetics.has(id)) {
            markCosmeticSeen(id);
        }
    };

    // Determine what is actively equipped
    const isEquipped = (id: string) => {
        if (activeTab === 'SKIN') return settings.snakeStyle === id;
        if (activeTab === 'HUD') return settings.hudConfig.layout === id;
        return false;
    };

    // Purchase Logic
    const handlePurchase = (id: string) => {
        const success = purchaseCosmetic(id);
        if (success) {
            audio.play('COSMETIC_UNLOCK');
        } else {
            audio.play('ARCHIVE_LOCK');
            setPurchaseError("INSUFFICIENT FRAGMENTS");
            setTimeout(() => setPurchaseError(null), 2000);
        }
    };

    // Apply Logic
    const handleApply = (id: string) => {
        const def = COSMETIC_REGISTRY[id];
        if (!def) return;

        if (def.type === 'SKIN') {
            setSettings(s => ({ ...s, snakeStyle: id }));
        } else if (def.type === 'HUD') {
            setSettings(s => ({ ...s, hudConfig: { ...s.hudConfig, layout: id as HUDLayoutMode } }));
        }
        audio.play('UI_HARD_CLICK');
    };

    // Derived Preview State
    const previewSkinId = activeTab === 'SKIN' && selectedId ? selectedId : currentSkin;
    
    // Detailed Item Data
    const detailsItem = selectedId ? COSMETIC_REGISTRY[selectedId] : null;
    const isVisible = detailsItem ? unlockedCosmetics.has(detailsItem.id) : false; // Can see it
    const isOwned = detailsItem ? purchasedCosmetics.has(detailsItem.id) : false; // Can equip it
    const isCurrentlyEquipped = detailsItem ? isEquipped(detailsItem.id) : false;

    // Check for NEW items in tabs
    const hasNewSkin = useMemo(() => Object.keys(COSMETIC_REGISTRY).some(k => COSMETIC_REGISTRY[k].type === 'SKIN' && unlockedCosmetics.has(k) && !seenCosmetics.has(k)), [unlockedCosmetics, seenCosmetics]);
    const hasNewHUD = useMemo(() => Object.keys(COSMETIC_REGISTRY).some(k => COSMETIC_REGISTRY[k].type === 'HUD' && unlockedCosmetics.has(k) && !seenCosmetics.has(k)), [unlockedCosmetics, seenCosmetics]);

    return (
        <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col font-mono text-cyan-500 overflow-hidden animate-in fade-in duration-300">
            
            {/* ── HEADER ── */}
            <div className="flex justify-between items-end border-b border-cyan-900/50 p-6 bg-black/80 backdrop-blur-md z-10">
                <div>
                    <div className="text-xs text-cyan-700 tracking-[0.3em] font-bold mb-1">SYSTEM_CONFIGURATION</div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-wider flex items-center gap-3">
                        PROTOCOL FORGE
                        <span className="text-xs bg-cyan-900/30 border border-cyan-700 px-2 py-0.5 rounded text-cyan-400 font-mono">v2.1</span>
                    </h1>
                </div>
                
                <div className="flex gap-6 items-center">
                     <div className="bg-black/40 border border-cyan-500/30 px-4 py-2 flex items-center gap-3 rounded">
                         <span className="text-xs text-cyan-500 tracking-widest font-bold">NEON FRAGMENTS</span>
                         <span className="text-xl text-white font-display text-shadow-cyan">{neonFragments}</span>
                     </div>

                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2 border border-cyan-800 hover:bg-cyan-900/40 hover:border-cyan-500 text-cyan-400 transition-all uppercase tracking-widest text-xs font-bold"
                    >
                        [ RETURN TO ROOT ]
                    </button>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* 1. LEFT: CATEGORY NAV */}
                <div className="w-64 bg-black/40 border-r border-cyan-900/30 flex flex-col p-4 gap-2">
                    <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-widest">Modules</div>
                    
                    <button 
                        onClick={() => { setActiveTab('SKIN'); setSelectedId(null); audio.play('MOVE'); }}
                        className={`flex justify-between items-center p-4 border transition-all duration-200 group ${activeTab === 'SKIN' ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-transparent hover:bg-white/5 hover:border-gray-700 text-gray-400'}`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-bold tracking-wide">CHASSIS</span>
                            {hasNewSkin && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse font-bold">NEW</span>}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${activeTab === 'SKIN' ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-gray-800'}`} />
                    </button>

                    <button 
                        onClick={() => { setActiveTab('HUD'); setSelectedId(null); audio.play('MOVE'); }}
                        className={`flex justify-between items-center p-4 border transition-all duration-200 group ${activeTab === 'HUD' ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-transparent hover:bg-white/5 hover:border-gray-700 text-gray-400'}`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-bold tracking-wide">NEURAL LINK</span>
                            {hasNewHUD && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse font-bold">NEW</span>}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${activeTab === 'HUD' ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-gray-800'}`} />
                    </button>
                </div>

                {/* 2. CENTER: BROWSER GRID (TIERED) */}
                <div className="flex-1 bg-gradient-to-b from-[#080808] to-[#020202] overflow-y-auto p-8 custom-scrollbar">
                    
                    {[1, 2, 3, 4].map((tier) => {
                        const items = tieredItems[tier];
                        if (items.length === 0) return null;

                        const tierColor = TIER_COLORS[tier as 1|2|3|4];

                        return (
                            <div key={tier} className="mb-8">
                                <div className={`flex items-center gap-4 mb-4 pb-2 border-b border-gray-800 ${tierColor}`}>
                                    <span className="font-display font-bold tracking-[0.2em] text-lg">TIER {tier} // {TIER_NAMES[tier as 1|2|3|4]}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {items.map((item) => {
                                        const visible = unlockedCosmetics.has(item.id);
                                        const owned = purchasedCosmetics.has(item.id);
                                        const seen = seenCosmetics.has(item.id);
                                        const equipped = isEquipped(item.id);
                                        const selected = selectedId === item.id;
                                        const isNew = visible && !seen;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item.id)}
                                                className={`
                                                    relative group flex flex-col aspect-[4/3] border transition-all duration-200 overflow-hidden
                                                    ${selected ? `border-cyan-400 bg-cyan-900/20 z-10 scale-[1.02]` : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-600'}
                                                    ${!visible ? 'opacity-40 grayscale pointer-events-none' : ''}
                                                    ${visible && !owned ? 'opacity-80' : ''}
                                                    ${isNew ? 'shadow-[0_0_15px_rgba(255,0,0,0.3)] border-red-500/50' : ''}
                                                `}
                                            >
                                                {/* NEW Badge */}
                                                {isNew && (
                                                    <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 z-20 shadow-md tracking-wider">
                                                        NEW
                                                    </div>
                                                )}

                                                {/* Visual Representation */}
                                                <div className="flex-1 flex items-center justify-center relative bg-black/20">
                                                    {!visible && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                                            <div className="text-center">
                                                                <span className="text-2xl block mb-1 text-gray-600">🔒</span>
                                                                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">LOCKED</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {visible && !owned && (
                                                        <div className="absolute top-2 right-2 z-10 bg-black/60 px-2 py-0.5 rounded text-[10px] text-yellow-500 font-bold border border-yellow-700/50">
                                                            {item.cost} NF
                                                        </div>
                                                    )}
                                                    
                                                    {/* Styled Icon */}
                                                    <div className={`text-4xl font-black ${owned ? 'text-cyan-700 group-hover:text-cyan-500' : 'text-gray-700'}`}>
                                                        {activeTab === 'HUD' ? '⬢' : '◆'}
                                                    </div>
                                                    
                                                    <div className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-600">
                                                        {item.id}
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className={`
                                                    px-3 py-2 border-t text-left flex justify-between items-center
                                                    ${selected ? 'bg-cyan-950/80 border-cyan-500/50' : 'bg-black border-gray-800'}
                                                `}>
                                                    <div className={`text-xs font-bold truncate ${selected ? 'text-white' : 'text-gray-400'}`}>
                                                        {item.displayName}
                                                    </div>
                                                    {equipped && <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#0f0]" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. RIGHT: PREVIEW & DETAILS */}
                <div className="w-96 bg-black border-l border-cyan-900/30 flex flex-col">
                    
                    {/* Live Preview Window (Always Snake Sim) */}
                    <div className="h-48 border-b border-cyan-900/30 bg-[#050505] relative flex flex-col overflow-hidden">
                        <div className="absolute top-2 left-2 text-[10px] text-cyan-700 font-bold tracking-widest z-10 bg-black/50 px-2 py-1">VISUAL_SIMULATION</div>
                        <div className="flex-1 relative overflow-hidden">
                            <SnakePreview snakeStyle={previewSkinId} charColor="#00ffff" />
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                        {detailsItem ? (
                            <>
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs text-gray-500 font-bold tracking-widest uppercase">{detailsItem.type} MODULE</div>
                                        <div className={`text-[10px] border px-2 py-0.5 rounded ${TIER_COLORS[detailsItem.tier]}`}>TIER {detailsItem.tier}</div>
                                    </div>
                                    
                                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                                        {isVisible ? detailsItem.displayName : 'ENCRYPTED DATA'}
                                    </h2>
                                    <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-cyan-900/50 pl-4 py-1 mb-4">
                                        {detailsItem.description}
                                    </p>

                                    {/* MINI HUD PREVIEW (Only for HUDs) */}
                                    {detailsItem.type === 'HUD' && (
                                        <div className="mb-4 flex justify-center border border-gray-800 bg-black p-2 rounded">
                                            <HUDPreview layoutId={detailsItem.id} width={240} height={180} />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto space-y-2">
                                    {!isVisible ? (
                                        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded text-center">
                                            <div className="text-red-500 font-bold text-xs tracking-widest mb-1">UNLOCK REQUIREMENT</div>
                                            <div className="text-red-300 text-sm">{detailsItem.unlockHint}</div>
                                        </div>
                                    ) : !isOwned ? (
                                        <>
                                            <div className="bg-black/60 border border-cyan-900/50 p-4 mb-2 flex justify-between items-center">
                                                <span className="text-gray-400 text-xs font-bold">COST</span>
                                                <span className={`text-lg font-bold ${neonFragments >= detailsItem.cost ? 'text-white' : 'text-red-500'}`}>
                                                    {detailsItem.cost} NF
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handlePurchase(detailsItem.id)}
                                                className={`
                                                    w-full py-4 font-bold tracking-[0.2em] text-sm uppercase transition-all
                                                    ${neonFragments >= detailsItem.cost 
                                                        ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                                    }
                                                `}
                                            >
                                                {purchaseError || "ACQUIRE MODULE"}
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => handleApply(detailsItem.id)}
                                            disabled={isCurrentlyEquipped}
                                            className={`
                                                w-full py-4 font-bold tracking-[0.2em] text-sm uppercase transition-all
                                                ${isCurrentlyEquipped 
                                                    ? 'bg-green-900/20 border border-green-700 text-green-500 cursor-default' 
                                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'}
                                            `}
                                        >
                                            {isCurrentlyEquipped ? 'SYSTEM ACTIVE' : 'COMPILE & APPLY'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-700 font-mono text-sm">
                                SELECT MODULE FOR ANALYSIS
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};
