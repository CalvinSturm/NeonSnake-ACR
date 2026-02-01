
import React, { useState, useMemo, useEffect } from 'react';
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
    1: 'border-green-500/50 text-green-500 shadow-green-500/20',
    2: 'border-cyan-500/50 text-cyan-500 shadow-cyan-500/20',
    3: 'border-orange-500/50 text-orange-500 shadow-orange-500/20',
    4: 'border-red-500/50 text-red-500 shadow-red-500/20'
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

    // Initial load & Tab switch: Auto-select equipped item
    useEffect(() => {
        const equippedId = activeTab === 'SKIN' ? settings.snakeStyle : settings.hudConfig.layout;
        // If the equipped item exists in registry (sanity check), select it
        if (COSMETIC_REGISTRY[equippedId]) {
            setSelectedId(equippedId);
        }
    }, [activeTab]); // Only run when tab changes (or on mount)

    // Group cosmetics by Tier
    const tieredItems = useMemo(() => {
        const filtered = Object.values(COSMETIC_REGISTRY).filter(c => c.type === activeTab);
        const groups: Record<number, CosmeticDef[]> = { 1: [], 2: [], 3: [], 4: [] };
        
        filtered.forEach(item => {
            if (groups[item.tier]) groups[item.tier].push(item);
        });
        
        // Sort: Owned first, then alphabetical
        Object.keys(groups).forEach(k => {
            const key = Number(k);
            groups[key].sort((a, b) => {
                const ownedA = purchasedCosmetics.has(a.id);
                const ownedB = purchasedCosmetics.has(b.id);
                if (ownedA && !ownedB) return -1;
                if (!ownedA && ownedB) return 1;
                return a.displayName.localeCompare(b.displayName);
            });
        });

        return groups;
    }, [activeTab, purchasedCosmetics]);

    // Determine what is actively equipped
    const isEquipped = (id: string) => {
        if (activeTab === 'SKIN') return settings.snakeStyle === id;
        if (activeTab === 'HUD') return settings.hudConfig.layout === id;
        return false;
    };

    const handleSelect = (id: string) => {
        if (selectedId === id) return;
        setSelectedId(id);
        setPurchaseError(null);
        audio.play('MOVE');
        
        if (unlockedCosmetics.has(id) && !seenCosmetics.has(id)) {
            markCosmeticSeen(id);
        }
    };

    const handlePurchase = (id: string) => {
        const success = purchaseCosmetic(id);
        if (success) {
            audio.play('COSMETIC_UNLOCK');
        } else {
            audio.play('ARCHIVE_LOCK');
            setPurchaseError("INSUFFICIENT FUNDS");
            setTimeout(() => setPurchaseError(null), 2000);
        }
    };

    const handleApply = (id: string) => {
        const def = COSMETIC_REGISTRY[id];
        if (!def) return;

        if (def.type === 'SKIN') {
            setSettings(s => ({ ...s, snakeStyle: id }));
        } else if (def.type === 'HUD') {
            setSettings(s => ({ ...s, hudConfig: { ...s.hudConfig, layout: id as HUDLayoutMode } }));
        }
        audio.play('CLI_BURST'); // Heavier confirmation sound
    };

    // Details Data
    const detailsItem = selectedId ? COSMETIC_REGISTRY[selectedId] : null;
    const isVisible = detailsItem ? unlockedCosmetics.has(detailsItem.id) : false;
    const isOwned = detailsItem ? purchasedCosmetics.has(detailsItem.id) : false;
    const isCurrentlyEquipped = detailsItem ? isEquipped(detailsItem.id) : false;

    // Badges for tabs
    const hasNewSkin = useMemo(() => Object.keys(COSMETIC_REGISTRY).some(k => COSMETIC_REGISTRY[k].type === 'SKIN' && unlockedCosmetics.has(k) && !seenCosmetics.has(k)), [unlockedCosmetics, seenCosmetics]);
    const hasNewHUD = useMemo(() => Object.keys(COSMETIC_REGISTRY).some(k => COSMETIC_REGISTRY[k].type === 'HUD' && unlockedCosmetics.has(k) && !seenCosmetics.has(k)), [unlockedCosmetics, seenCosmetics]);

    return (
        <div className="absolute inset-0 bg-[#020202] z-50 flex flex-col font-mono text-gray-300 overflow-hidden animate-in fade-in duration-300">
            
            {/* ── BACKGROUND ── */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#001122_0%,#000000_60%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

            {/* ── HEADER ── */}
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-gray-800 bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-900/20 border border-cyan-500/50 flex items-center justify-center rounded">
                        <span className="text-xl">🛠️</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-widest font-display">ARMORY</h1>
                        <div className="text-[10px] text-cyan-600 font-bold tracking-[0.2em] uppercase">Visual Customization Suite</div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Currency Display */}
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Fragments</span>
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xl font-bold text-shadow-cyan">
                            <span>{neonFragments}</span>
                            <span className="text-sm opacity-50">NF</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 border border-gray-700 hover:border-white hover:bg-white/10 flex items-center justify-center rounded transition-all text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* ── CONTENT AREA ── */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                
                {/* 1. SIDEBAR TABS */}
                <div className="w-20 md:w-64 border-r border-gray-800 bg-[#050505] flex flex-col">
                    <TabButton 
                        active={activeTab === 'SKIN'} 
                        onClick={() => setActiveTab('SKIN')} 
                        label="CHASSIS" 
                        subLabel="Snake Skins"
                        icon="🐍"
                        hasNew={hasNewSkin}
                    />
                    <TabButton 
                        active={activeTab === 'HUD'} 
                        onClick={() => setActiveTab('HUD')} 
                        label="INTERFACE" 
                        subLabel="HUD Layouts"
                        icon="🖥️"
                        hasNew={hasNewHUD}
                    />
                </div>

                {/* 2. GRID BROWSER */}
                <div className="flex-1 bg-[#0a0a0a] overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {[1, 2, 3, 4].map(tier => {
                            const items = tieredItems[tier];
                            if (items.length === 0) return null;
                            const tierColorClass = TIER_COLORS[tier as 1|2|3|4];

                            return (
                                <div key={tier} className="animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-backwards" style={{ animationDelay: `${tier * 100}ms` }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`px-3 py-1 border rounded text-[10px] font-bold tracking-widest uppercase ${tierColorClass} bg-black`}>
                                            Tier {tier}
                                        </div>
                                        <div className="h-px flex-1 bg-gray-800"></div>
                                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{TIER_NAMES[tier as 1|2|3|4]}</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {items.map(item => {
                                            const visible = unlockedCosmetics.has(item.id);
                                            const owned = purchasedCosmetics.has(item.id);
                                            const equipped = isEquipped(item.id);
                                            const selected = selectedId === item.id;
                                            const isNew = visible && !seenCosmetics.has(item.id);

                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSelect(item.id)}
                                                    className={`
                                                        relative aspect-square flex flex-col justify-between p-3 border rounded-lg transition-all duration-200 group
                                                        ${selected ? 'border-cyan-500 bg-cyan-900/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50' : 'border-gray-800 bg-[#111] hover:border-gray-600'}
                                                        ${!visible && 'opacity-50 grayscale cursor-not-allowed'}
                                                    `}
                                                >
                                                    {isNew && <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">NEW</div>}
                                                    {equipped && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />}
                                                    
                                                    {/* Center Graphic */}
                                                    <div className="flex-1 flex items-center justify-center">
                                                        {visible ? (
                                                            <div className={`text-3xl filter transition-transform duration-300 ${selected ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'scale-100 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                                                                {item.type === 'HUD' ? '⬢' : '◆'}
                                                            </div>
                                                        ) : (
                                                            <span className="text-2xl opacity-20">🔒</span>
                                                        )}
                                                    </div>

                                                    {/* Footer info */}
                                                    <div className="text-left">
                                                        <div className={`text-[10px] font-bold truncate ${selected ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                            {item.displayName}
                                                        </div>
                                                        {visible && !owned && (
                                                            <div className="text-[9px] text-yellow-600 font-mono mt-0.5">
                                                                {item.cost} NF
                                                            </div>
                                                        )}
                                                        {visible && owned && !equipped && (
                                                            <div className="text-[9px] text-gray-700 font-mono mt-0.5 uppercase">OWNED</div>
                                                        )}
                                                        {equipped && (
                                                            <div className="text-[9px] text-green-700 font-mono mt-0.5 uppercase">ACTIVE</div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. INSPECTOR (Right Panel) */}
                <div className="w-80 md:w-96 bg-[#080808] border-l border-gray-800 flex flex-col shrink-0 relative shadow-2xl">
                    {detailsItem ? (
                        <>
                            {/* Preview Window */}
                            <div className="h-64 bg-black relative border-b border-gray-800 flex items-center justify-center overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]" />
                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px]" />
                                
                                <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105">
                                    {detailsItem.type === 'SKIN' && (
                                        <div className="scale-125">
                                            <SnakePreview snakeStyle={selectedId || 'AUTO'} charColor="#00ffff" />
                                        </div>
                                    )}
                                    {detailsItem.type === 'HUD' && (
                                        <HUDPreview layoutId={selectedId || 'CYBER'} width={280} height={180} />
                                    )}
                                </div>

                                <div className="absolute bottom-2 right-2 text-[9px] text-gray-600 font-mono">PREVIEW_MODE // LIVE</div>
                            </div>

                            {/* Info */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TIER_COLORS[detailsItem.tier]}`}>
                                            TIER {detailsItem.tier}
                                        </span>
                                        {isOwned && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">✓ ACQUIRED</span>}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2 font-display">{detailsItem.displayName}</h2>
                                    <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-3">
                                        {detailsItem.description}
                                    </p>
                                </div>

                                <div className="mt-auto">
                                    {!isVisible ? (
                                        <div className="p-4 bg-red-950/10 border border-red-900/30 rounded text-center">
                                            <div className="text-red-500 font-bold text-xs mb-1">LOCKED</div>
                                            <div className="text-[10px] text-red-400/70">{detailsItem.unlockHint}</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {!isOwned ? (
                                                <>
                                                    <div className="flex justify-between items-center text-sm font-bold bg-gray-900 p-3 rounded border border-gray-800">
                                                        <span className="text-gray-400">PRICE</span>
                                                        <span className={neonFragments >= detailsItem.cost ? 'text-yellow-400' : 'text-red-500'}>
                                                            {detailsItem.cost} NF
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handlePurchase(detailsItem.id)}
                                                        className={`
                                                            w-full py-4 font-bold tracking-widest text-sm uppercase rounded transition-all shadow-lg
                                                            ${neonFragments >= detailsItem.cost 
                                                                ? 'bg-yellow-600 hover:bg-yellow-500 text-black hover:scale-[1.02]' 
                                                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
                                                        `}
                                                    >
                                                        {purchaseError || "PURCHASE"}
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleApply(detailsItem.id)}
                                                    disabled={isCurrentlyEquipped}
                                                    className={`
                                                        w-full py-4 font-bold tracking-widest text-sm uppercase rounded transition-all shadow-lg
                                                        ${isCurrentlyEquipped 
                                                            ? 'bg-green-900/30 text-green-500 border border-green-800 cursor-default' 
                                                            : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-[1.02] shadow-cyan-900/20'}
                                                    `}
                                                >
                                                    {isCurrentlyEquipped ? 'EQUIPPED' : 'EQUIP MODULE'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-700 p-8 text-center">
                            <div className="text-4xl mb-4 opacity-20">❖</div>
                            <div className="text-xs font-mono">SELECT A MODULE<br/>TO VIEW DETAILS</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

const TabButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    label: string; 
    subLabel: string;
    icon: string;
    hasNew?: boolean;
}> = ({ active, onClick, label, subLabel, icon, hasNew }) => (
    <button
        onClick={onClick}
        className={`
            w-full p-4 md:p-6 text-left border-l-4 transition-all duration-200 group relative
            ${active 
                ? 'bg-cyan-950/20 border-cyan-500' 
                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-gray-700'}
        `}
    >
        <div className="flex items-center justify-between mb-1">
            <span className={`text-xl filter ${active ? 'grayscale-0' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>{icon}</span>
            {hasNew && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />}
        </div>
        <div className={`font-bold tracking-wider text-sm ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
            {label}
        </div>
        <div className="text-[10px] text-gray-600 font-mono hidden md:block">
            {subLabel}
        </div>
    </button>
);
