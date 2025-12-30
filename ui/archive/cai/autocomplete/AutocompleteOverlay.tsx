
import React from 'react';
import { AutocompleteResult } from './matchAutocomplete';

interface AutocompleteOverlayProps {
  suggestions: AutocompleteResult[];
  selectedIndex: number;
}

export const AutocompleteOverlay: React.FC<AutocompleteOverlayProps> = ({ suggestions, selectedIndex }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 w-full mb-1 bg-black/90 border border-green-900/50 backdrop-blur-sm shadow-xl flex flex-col-reverse overflow-hidden z-50">
        {/* Render bottom-up visual stack */}
        {suggestions.map((result, idx) => {
            const isSelected = idx === selectedIndex;
            return (
                <div 
                    key={result.command} 
                    className={`
                        px-2 py-1 flex justify-between items-center text-[10px] font-mono border-t border-green-900/20 first:border-t-0
                        ${isSelected ? 'bg-green-900/30 text-green-300' : 'text-green-700'}
                    `}
                >
                    <span className="tracking-wider">{result.command}</span>
                    <span className="opacity-50 text-[8px] uppercase">{result.original.description}</span>
                </div>
            );
        })}
        <div className="bg-green-950/50 text-green-600 text-[8px] px-2 py-0.5 border-b border-green-900/30 tracking-widest font-bold">
            AUTO_COMPLETE :: {suggestions.length} MATCHES
        </div>
    </div>
  );
};
