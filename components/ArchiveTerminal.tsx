
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ROOT_FILESYSTEM } from '../archive/data';
import { VirtualFile, ArchiveCapabilities } from '../archive/types';
import { audio } from '../utils/audio';
import { getUnlockedMemoryIds } from '../game/memory/MemorySystem';
import { CAIPanel } from '../ui/archive/cai/CAIPanel';
import { VIRTUAL_ROOT, VIRTUAL_DIRECTORIES, resolveVirtualPath } from '../ui/archive/fs/virtualFileSystem';

interface ArchiveTerminalProps {
  onClose: () => void;
}

export const ArchiveTerminal: React.FC<ArchiveTerminalProps> = ({ onClose }) => {
  const [capabilities, setCapabilities] = useState<ArchiveCapabilities>({ aiModuleTier: 'MISSING' });
  const [currentPath, setCurrentPath] = useState(VIRTUAL_ROOT);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [bootSequence, setBootSequence] = useState(true);
  const [sortCol, setSortCol] = useState<'name' | 'size' | 'type'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); 
  
  const [unlockedFiles, setUnlockedFiles] = useState<string[]>([]);
  const [isMobileCAI, setIsMobileCAI] = useState(false); // Toggle for mobile
  
  // Boot Sequence State
  const [bootLines, setBootLines] = useState<string[]>([]);
  const bootLinesRef = useRef<string[]>([]);

  useEffect(() => {
    // Start fast boot sequence
    const bootData = [
        "KERNEL_INIT...",
        "MOUNTING_VOLUME_0...",
        "DECRYPTING_INDEX...",
        "VERIFYING_HASHES...",
        "LOADING_UI_FRAMEWORK...",
        "ESTABLISHING_SECURE_LINK...",
        "ACCESS_GRANTED."
    ];

    let lineIdx = 0;
    const interval = setInterval(() => {
        if (lineIdx >= bootData.length) {
            clearInterval(interval);
            setTimeout(() => setBootSequence(false), 200); // Slight pause after text finishes
        } else {
            bootLinesRef.current = [...bootLinesRef.current, bootData[lineIdx]];
            setBootLines([...bootLinesRef.current]);
            audio.play('MOVE'); // Ticking sound
            lineIdx++;
        }
    }, 50); // Fast text speed

    setUnlockedFiles(getUnlockedMemoryIds());
    return () => clearInterval(interval);
  }, []);

  // ─── CONTENT RESOLUTION ───
  const { visiblePath, resolvedPath, isVirtualRoot } = useMemo(() => 
    resolveVirtualPath(currentPath), 
  [currentPath]);

  const currentContent = useMemo(() => {
      if (isVirtualRoot) return null; // Handled by specific UI
      
      if (resolvedPath === ROOT_FILESYSTEM.path) {
          return ROOT_FILESYSTEM.contents.filter(f => !f.visibleWhen || f.visibleWhen(capabilities));
      }
      
      return []; // Empty for unknown paths
  }, [resolvedPath, isVirtualRoot, capabilities]);

  // ─── SORTING ───
  const sortedFiles = useMemo(() => {
    if (!currentContent) return [];
    return [...currentContent].sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortCol === 'size') {
        valA = a.sizeBytes;
        valB = b.sizeBytes;
      } else if (sortCol === 'type') {
        valA = a.type;
        valB = b.type;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [currentContent, sortCol, sortAsc]);

  const handleFileClick = (file: VirtualFile) => {
    if (file.type === 'dir') {
      audio.play('ARCHIVE_LOCK'); 
      return;
    }

    const isUnlocked = unlockedFiles.includes(file.id);
    
    if (!isUnlocked) {
        audio.play('ARCHIVE_LOCK');
        setSelectedFile(file);
        return;
    }

    if (file.encrypted && capabilities.aiModuleTier !== 'ORACLE') {
      audio.play('ARCHIVE_LOCK');
      setSelectedFile(file);
      return;
    }

    audio.play('XP_COLLECT');
    setSelectedFile(file);
  };

  const closeFile = () => {
    audio.play('MOVE');
    setSelectedFile(null);
  };

  const handleNavigate = (path: string) => {
      setCurrentPath(path);
      audio.play('MOVE');
  };

  const handleBack = () => {
      if (selectedFile) {
          closeFile();
          return;
      }
      if (currentPath !== VIRTUAL_ROOT) {
          handleNavigate(VIRTUAL_ROOT);
      } else {
          onClose();
      }
  };

  if (bootSequence) {
    return (
      <div className="absolute inset-0 bg-[#020502] z-50 flex items-center justify-center pointer-events-auto">
        {/* CRT Turn-On Animation: Scale Y from 0 to 1 */}
        <div className="w-full h-1 bg-green-500 animate-crt-expand relative overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-black opacity-90" /> {/* Darken slightly */}
             
             <div className="relative z-10 w-64 font-mono text-xs text-green-500">
                {bootLines.map((line, i) => (
                    <div key={i} className="opacity-80">{`> ${line}`}</div>
                ))}
                <div className="animate-pulse mt-2">_</div>
             </div>
             
             {/* Scanline overlay inside the boot screen */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(0,255,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-50"></div>
        </div>
        
        <style>{`
            @keyframes crt-expand {
                0% { height: 2px; width: 100%; opacity: 0; }
                20% { height: 2px; width: 100%; opacity: 1; }
                50% { height: 100%; width: 100%; }
                100% { height: 100%; width: 100%; }
            }
            .animate-crt-expand {
                animation: crt-expand 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 bg-[#020502] z-50 flex flex-col font-mono text-sm md:text-base text-green-500 p-2 md:p-8 overflow-hidden pointer-events-auto selection:bg-green-900 selection:text-white animate-in fade-in duration-300`}>
      
      {/* ── CRT SCANLINES ── */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      
      {/* ────────────────── HEADER ────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-green-800 pb-4 mb-4 md:mb-6 shrink-0 relative z-10 gap-4 md:gap-0">
        <div className="w-full md:w-auto">
          <div className="text-[10px] text-green-800 tracking-widest mb-1 flex items-center gap-2">
              <span>SYSTEM_ARCHIVE // OMEGA_ACTUAL</span>
              <span className="text-green-900">|</span>
              <span className="text-green-600">OPERATOR INTERFACE LAYER</span>
          </div>
          <div className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-2 md:gap-3">
             <span className="animate-pulse">_MEMORY_MODULES</span>
             <span className="text-xs border border-green-800 px-2 py-0.5 rounded bg-green-900/20 text-green-600 font-mono truncate max-w-[200px]">
                 {visiblePath}
             </span>
          </div>
        </div>
        
        <div className="w-full md:w-auto text-right flex flex-row-reverse md:flex-col items-center md:items-end justify-between gap-2">
          <div className="text-[10px] text-green-700">ENCRYPTION_TIER: {capabilities.aiModuleTier}</div>
          <div className="flex gap-2">
             {!isVirtualRoot && !selectedFile && (
                 <button 
                    onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                    className="hover:bg-green-900/50 text-green-600 hover:text-white px-2 py-1 md:px-3 border border-green-800 text-xs tracking-widest transition-colors"
                 >
                    [ {viewMode.toUpperCase()} ]
                 </button>
             )}
             
             {/* Mobile CAI Toggle */}
             <button
                className="md:hidden hover:bg-green-900/50 text-green-600 hover:text-white px-2 py-1 border border-green-800 text-xs tracking-widest transition-colors"
                onClick={() => setIsMobileCAI(!isMobileCAI)}
             >
                {isMobileCAI ? '[ HIDE CAI ]' : '[ SHOW CAI ]'}
             </button>

             <button onClick={handleBack} className="hover:bg-green-900/50 text-green-600 hover:text-white px-4 py-1 border border-green-800 text-xs tracking-widest transition-colors">
                [ {currentPath === VIRTUAL_ROOT ? 'EJECT' : 'RETURN'} ]
             </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MAIN LAYOUT ────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative z-10 gap-4 overflow-hidden">
          
          {/* LEFT: CONTENT BROWSER */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative pr-2 ${isMobileCAI ? 'hidden md:flex' : 'flex'}`}>
              
              {/* ── MODE 1: VIRTUAL ROOT (DESKTOP) ── */}
              {isVirtualRoot ? (
                  <div className="flex-1 overflow-y-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.values(VIRTUAL_DIRECTORIES).map((dir) => (
                              <button
                                  key={dir.id}
                                  onClick={() => {
                                      if (dir.isRestricted) {
                                          audio.play('ARCHIVE_LOCK');
                                      } else {
                                          handleNavigate(dir.resolvesTo);
                                      }
                                  }}
                                  className={`
                                      group flex flex-col items-center justify-center p-6 border border-green-900/50 bg-black/40 rounded hover:bg-green-900/20 hover:border-green-500 transition-all
                                      ${dir.isRestricted ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                                  `}
                              >
                                  <div className="text-4xl mb-3 filter drop-shadow-[0_0_5px_rgba(0,255,0,0.5)] group-hover:scale-110 transition-transform">
                                      {dir.icon}
                                  </div>
                                  <div className="text-sm font-bold tracking-widest mb-1">{dir.name}</div>
                                  <div className="text-[10px] text-green-700 font-mono text-center">
                                      {dir.isRestricted ? '[ ACCESS DENIED ]' : dir.description}
                                  </div>
                              </button>
                          ))}
                      </div>
                      <div className="mt-8 text-center text-xs text-green-900 font-mono">
                          RAW PATHS MASKED TO REDUCE ERROR.
                      </div>
                  </div>
              ) : 
              
              /* ── MODE 2: FILE VIEWER ── */
              selectedFile ? (
                <div className="flex-1 flex flex-col min-h-0 bg-green-950/10 border border-green-800 p-2 md:p-4 relative animate-in fade-in zoom-in-95 duration-200 z-20">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4 border-b border-green-800 pb-2 gap-2">
                    <div>
                      <div className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                          <span className="text-green-600 text-sm">READING_MEMORY:</span> {selectedFile.name}
                      </div>
                      <div className="text-xs text-green-600 font-mono mt-1">
                        SIZE: {selectedFile.sizeDisplay} | TYPE: {selectedFile.type.toUpperCase()} 
                        {selectedFile.encrypted ? ` | ENC: ${selectedFile.encrypted.type}` : ''}
                      </div>
                    </div>
                    <button 
                      onClick={closeFile}
                      className="text-green-500 hover:text-white border border-green-700 hover:bg-green-900 px-4 py-2 text-xs font-bold tracking-widest self-end md:self-auto"
                    >
                      [ CLOSE ]
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed text-green-300 custom-scrollbar p-2 bg-black/20">
                    {!unlockedFiles.includes(selectedFile.id) && selectedFile.type === 'file' ? (
                        <div className="flex flex-col gap-4 h-full justify-center items-center">
                            <div className="text-4xl text-gray-700 mb-4 animate-pulse">🔒</div>
                            <div className="bg-gray-950/50 border border-gray-700 p-6 text-gray-400 text-center max-w-lg">
                              <div className="font-bold tracking-widest text-lg mb-2">DATA CORRUPTED</div>
                              <div className="text-xs opacity-70">Recover "Memory Module: {selectedFile.id}" from terminal systems to decrypt.</div>
                            </div>
                        </div>
                    ) : 
                    selectedFile.encrypted && capabilities.aiModuleTier !== 'ORACLE' ? (
                      <div className="flex flex-col gap-4 h-full justify-center items-center">
                        <div className="text-4xl text-red-900 mb-4 animate-pulse">🔐</div>
                        <div className="bg-red-950/20 border border-red-900 p-6 text-red-400 text-center max-w-lg">
                          <div className="font-bold tracking-widest text-lg mb-2">ACCESS DENIED</div>
                          <div className="text-xs opacity-70">Decryption Key Missing (Tier: {capabilities.aiModuleTier})</div>
                        </div>
                        {selectedFile.contentSummary && (
                          <div className="opacity-80 max-w-lg border-t border-red-900/30 pt-4 mt-4">
                            <div className="text-xs text-green-700 mb-2 text-center">/// AI ANALYSIS (CONFIDENCE: {(selectedFile.confidence || 0) * 100}%) ///</div>
                            <div className="text-gray-400 text-xs italic">{selectedFile.contentSummary}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={selectedFile.encrypted ? 'text-cyan-300' : ''}>
                        {selectedFile.contentFull || selectedFile.content}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-green-900/50 text-[10px] text-green-800 flex justify-between uppercase">
                     <span>End of Stream</span>
                     <span>Status: Mounted (RO)</span>
                  </div>
                </div>
              ) :
              
              /* ── MODE 3: DIRECTORY LISTING ── */
              currentContent ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* SORT BAR */}
                  <div className="flex justify-between items-center mb-4 px-2">
                      <div className="text-xs text-green-800">{sortedFiles.length} OBJECTS</div>
                      <div className="flex gap-4 text-[10px] font-bold text-green-700">
                          <button onClick={() => { setSortCol('name'); setSortAsc(!sortAsc); }} className={`hover:text-green-400 ${sortCol==='name'?'text-green-500':''}`}>NAME {sortCol==='name' && (sortAsc?'▲':'▼')}</button>
                          <button onClick={() => { setSortCol('size'); setSortAsc(!sortAsc); }} className={`hover:text-green-400 ${sortCol==='size'?'text-green-500':''}`}>SIZE {sortCol==='size' && (sortAsc?'▲':'▼')}</button>
                          <button onClick={() => { setSortCol('type'); setSortAsc(!sortAsc); }} className={`hover:text-green-400 ${sortCol==='type'?'text-green-500':''}`}>TYPE {sortCol==='type' && (sortAsc?'▲':'▼')}</button>
                      </div>
                  </div>

                  {viewMode === 'list' ? (
                    <div className="flex flex-col gap-1 pb-20">
                        {/* Header Row (Hidden on mobile) */}
                        <div className="hidden md:flex px-2 text-[10px] text-green-800 border-b border-green-900/50 pb-2 mb-2 font-bold tracking-wider">
                            <div className="w-24">PERMISSIONS</div>
                            <div className="w-24 text-right pr-4">SIZE</div>
                            <div className="w-32">MODIFIED</div>
                            <div className="flex-1">NAME</div>
                        </div>

                        {sortedFiles.map((file) => {
                            const isMemoryLocked = !unlockedFiles.includes(file.id) && file.type === 'file';
                            const isEncrypted = file.encrypted && capabilities.aiModuleTier !== 'ORACLE';
                            const isDir = file.type === 'dir';
                            const isLocked = isMemoryLocked || isEncrypted;
                            
                            return (
                                <div 
                                    key={file.name}
                                    onClick={() => handleFileClick(file)}
                                    className={`
                                        flex flex-col md:flex-row md:items-center px-2 py-3 md:py-2 border-b border-green-900/30 font-mono text-xs cursor-pointer transition-colors gap-1 md:gap-0
                                        ${isLocked ? 'text-gray-600 hover:bg-red-950/10' : 'text-green-400 hover:bg-green-900/20 hover:text-white'}
                                    `}
                                >
                                    <div className="hidden md:block w-24 opacity-60 font-mono">{file.permissions || '-r--------'}</div>
                                    <div className="hidden md:block w-24 text-right pr-4 opacity-60 font-mono">{file.sizeDisplay}</div>
                                    <div className="hidden md:block w-32 opacity-60">{file.modified.split(' ')[0]}</div>
                                    <div className="flex-1 font-bold flex items-center gap-2">
                                        <span className="text-base">{isDir ? '📁' : isMemoryLocked ? '🔒' : isEncrypted ? '🔐' : '📄'}</span>
                                        <span className="truncate">{isMemoryLocked ? 'CORRUPTED_DATA_SEGMENT' : file.name}</span>
                                        {/* Mobile Metadata */}
                                        <div className="md:hidden ml-auto text-[10px] opacity-50">{file.sizeDisplay}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                      {sortedFiles.map((file) => {
                        const isMemoryLocked = !unlockedFiles.includes(file.id) && file.type === 'file';
                        const isEncrypted = file.encrypted && capabilities.aiModuleTier !== 'ORACLE';
                        const isDir = file.type === 'dir';
                        const isLocked = isMemoryLocked || isEncrypted;

                        const colorClass = isMemoryLocked 
                            ? 'border-gray-800 bg-gray-900/50 text-gray-600' 
                            : isEncrypted 
                                ? 'border-red-900/60 bg-red-950/10 text-red-500' 
                                : 'border-green-800/60 bg-green-900/10 text-green-500';
                        
                        const hoverClass = isLocked ? 'hover:border-red-500 hover:bg-red-900/20' : 'hover:border-green-400 hover:bg-green-900/20';
                        
                        return (
                          <button 
                            key={file.name} 
                            onClick={() => handleFileClick(file)}
                            className={`
                              relative group h-28 md:h-32 border-2 flex flex-col p-3 transition-all duration-200
                              ${colorClass} ${hoverClass}
                            `}
                          >
                            <div className="flex justify-between items-start w-full mb-2">
                                <div className="text-[10px] opacity-60 tracking-widest">{file.type === 'dir' ? 'DIR' : isMemoryLocked ? 'ERR' : 'DAT'}</div>
                                <div className="text-[10px] opacity-60 font-mono">{file.sizeDisplay}</div>
                            </div>
                            <div className="flex-1 flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity">
                                {isDir ? (
                                    <span className="text-2xl">///</span>
                                ) : (
                                    <div className="text-xl">
                                        {isMemoryLocked ? '🔒' : isEncrypted ? '🔐' : '📄'}
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto w-full text-left">
                                <div className={`text-xs md:text-sm font-bold truncate ${isLocked ? 'text-gray-500' : 'text-green-400 group-hover:text-white'}`}>
                                    {isMemoryLocked ? 'CORRUPTED' : file.name}
                                </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                  /* ── EMPTY / INVALID STATE ── */
                  <div className="flex-1 flex items-center justify-center text-green-900 flex-col gap-2">
                      <div className="text-4xl">∅</div>
                      <div className="text-sm font-bold">DIRECTORY EMPTY</div>
                      <div className="text-xs">Or insufficient permissions.</div>
                  </div>
              )}
          </div>

          {/* RIGHT: CAI-OS PANEL */}
          <div className={`${isMobileCAI ? 'flex' : 'hidden'} md:flex w-full md:w-80 h-full border-t md:border-t-0 md:border-l border-green-900/50`}>
              <CAIPanel capabilities={capabilities} />
          </div>

      </div>
    </div>
  );
};
