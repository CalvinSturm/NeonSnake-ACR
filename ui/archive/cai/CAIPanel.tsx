
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCAI } from './useCAI';
import { ArchiveCapabilities } from '../../../archive/types';
import { COMMAND_REGISTRY } from './autocomplete/commandRegistry';
import { matchAutocomplete, AutocompleteContext } from './autocomplete/matchAutocomplete';
import { AutocompleteOverlay } from './autocomplete/AutocompleteOverlay';

interface CAIPanelProps {
    capabilities: ArchiveCapabilities;
}

export const CAIPanel: React.FC<CAIPanelProps> = ({ capabilities }) => {
    const { status, output, processQuery, history, historyIndex, setHistoryIndex } = useCAI(capabilities);
    const [inputVal, setInputVal] = useState('');
    const [suggestions, setSuggestions] = useState<ReturnType<typeof matchAutocomplete>>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);

    // ── AUTOCOMPLETE LOGIC ──
    const acContext = useMemo<AutocompleteContext>(() => {
        const flags = new Set<string>();
        if (capabilities.aiModuleTier === 'ORACLE') flags.add('ORACLE_TIER');
        return {
            unlockedFlags: flags,
            inCombat: false // Archive is strictly non-combat UI
        };
    }, [capabilities]);

    // Update suggestions when input changes
    useEffect(() => {
        if (!inputVal.trim()) {
            setSuggestions([]);
            setSuggestionIndex(-1);
            return;
        }
        
        // Don't autocomplete if we are scrolling history
        if (historyIndex !== -1) {
            setSuggestions([]);
            return;
        }

        const matches = matchAutocomplete(inputVal, COMMAND_REGISTRY, acContext);
        setSuggestions(matches);
        setSuggestionIndex(matches.length > 0 ? 0 : -1); // Default select first
    }, [inputVal, acContext, historyIndex]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        let finalCommand = inputVal;
        
        processQuery(finalCommand);
        setInputVal('');
        setSuggestions([]);
        setSuggestionIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 1. AUTOCOMPLETE NAVIGATION
        if (suggestions.length > 0) {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (suggestionIndex !== -1 && suggestions[suggestionIndex]) {
                    setInputVal(suggestions[suggestionIndex].command);
                    setSuggestions([]); // Close AC on commit
                }
                return;
            }
            
            if (e.key === 'ArrowUp') {
                e.preventDefault(); // Prevent cursor move
                setSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                return;
            }
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                return;
            }
        }

        // 2. HISTORY NAVIGATION (Only if AC inactive or empty input)
        // If AC is active, Up/Down cycle AC. If AC closed, cycle history.
        if (suggestions.length === 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (history.length > 0) {
                    const newIndex = Math.min(historyIndex + 1, history.length - 1);
                    setHistoryIndex(newIndex);
                    setInputVal(history[newIndex]);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    const newIndex = Math.max(-1, historyIndex - 1);
                    setHistoryIndex(newIndex);
                    setInputVal(newIndex >= 0 ? history[newIndex] : '');
                } else {
                    setHistoryIndex(-1);
                    setInputVal('');
                }
            }
        }
        
        // 3. ESCAPE
        if (e.key === 'Escape') {
            if (suggestions.length > 0) {
                setSuggestions([]);
            } else {
                setInputVal('');
            }
        }
    };

    // Auto-focus on idle
    useEffect(() => {
        if (status === 'IDLE') {
            inputRef.current?.focus();
        }
    }, [status]);

    return (
        <div className="flex flex-col h-full bg-black/40 w-full shrink-0 relative">
            {/* Header */}
            <div className="p-2 border-b border-green-900/50 text-[10px] text-green-700 font-bold tracking-widest flex justify-between items-center">
                <span>CAI-OS INTERFACE</span>
                <span className={`w-2 h-2 rounded-full ${status === 'PROCESSING' ? 'bg-yellow-500 animate-pulse' : 'bg-green-900'}`}></span>
            </div>

            {/* Output Log */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-4 custom-scrollbar flex flex-col-reverse">
                {output.map((entry, i) => (
                    <div key={i} className={`whitespace-pre-wrap leading-relaxed ${i === 0 ? 'text-green-400' : 'text-green-800 opacity-60'}`}>
                        <span className="opacity-50 select-none mr-2">{`>`}</span>
                        {entry}
                    </div>
                ))}
            </div>

            {/* Input Line Container */}
            <div className="relative border-t border-green-900/50 bg-black/60">
                
                {/* Autocomplete Overlay */}
                <AutocompleteOverlay suggestions={suggestions} selectedIndex={suggestionIndex} />

                <form onSubmit={handleSubmit} className="p-2 flex items-center gap-2">
                    <span className="text-green-600 font-mono select-none">{`>`}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={status === 'PROCESSING'}
                        className="bg-transparent border-none outline-none text-green-400 font-mono text-xs w-full placeholder-green-900"
                        placeholder={status === 'PROCESSING' ? "PROCESSING..." : "ENTER QUERY"}
                        maxLength={120}
                        spellCheck={false}
                        autoComplete="off"
                    />
                </form>
            </div>
            
            {/* Corner Deco */}
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-600 opacity-50 pointer-events-none"></div>
        </div>
    );
};
