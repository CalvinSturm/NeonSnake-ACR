import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useCallback } from 'react';
import { useGameState } from '../game/useGameState';
import { useGameLoop } from '../game/useGameLoop';
import { useRendering } from '../game/useRendering';
import { useInput } from '../game/useInput';
import { useMovement } from '../game/useMovement';
import { useCollisions } from '../game/useCollisions';
import { useCombat } from '../game/useCombat';
import { useSpawner } from '../game/useSpawner';
import { useProgression } from '../game/useProgression';
import { useFX } from '../game/useFX';
import { useStageController } from '../game/useStageController';
import { useMusic } from '../game/useMusic';
import { GameStatus, Direction } from '../types';
import { STAGE_THEMES, CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SETTINGS, DIFFICULTY_CONFIGS, CHARACTERS, TRANSITION_DURATION, COMBO_DECAY_DURATION } from '../constants';
import { audio } from '../utils/audio';
import { formatTime, getThreatLevel } from '../game/gameUtils';
const SnakeGame = () => {
    const canvasRef = useRef(null);
    const timerRef = useRef(null);
    const scoreDisplayRef = useRef(null);
    const visualScoreRef = useRef(0);
    /* ─────────────────────────────
       GAME STATE
       ───────────────────────────── */
    const game = useGameState();
    const { status, setStatus, difficulty, setDifficulty, unlockedDifficulties, uiScore, uiXp, uiLevel, uiStage, highScore, setHighScore, uiCombo, uiShield, bossActive, setSelectedChar, upgradeOptions, resumeCountdown, setResumeCountdown, activePowerUps, enemiesRef, stageRef, resetGame, startTimeRef, enemiesKilledRef, terminalsHackedRef, failureMessageRef, abilityCooldownsRef, gameTimeRef, invulnerabilityTimeRef, terminalsRef, scoreRef, audioEventsRef, projectilesRef, minesRef, shockwavesRef, lightningArcsRef, particlesRef, floatingTextsRef, foodRef, transitionStartTimeRef, bossEnemyRef, bossActiveRef, isMuted, setIsMuted } = game;
    // ... (Systems init)
    const progression = useProgression(game);
    const fx = useFX(game);
    const spawner = useSpawner(game, fx.triggerShake);
    const combat = useCombat(game, spawner, fx, progression);
    const movement = useMovement(game, spawner);
    const collisions = useCollisions(game, combat, spawner, fx, progression);
    const stage = useStageController(game, spawner, fx, progression);
    // ── MUSIC SYSTEM ──
    const music = useMusic(game);
    const rendering = useRendering(canvasRef, game);
    // ── DRAW LOOP WRAPPER (Updates UI Timer & Score) ──
    const draw = useCallback((alpha) => {
        rendering.draw(alpha);
        // Update Timer
        if (timerRef.current) {
            timerRef.current.innerText = formatTime(gameTimeRef.current, true);
        }
        // Update Score (Lerp)
        const targetScore = scoreRef.current;
        const diff = targetScore - visualScoreRef.current;
        // Interpolate if difference is significant, else snap
        if (Math.abs(diff) > 0.5) {
            visualScoreRef.current += diff * 0.1; // 10% ease per frame
        }
        else {
            visualScoreRef.current = targetScore;
        }
        if (scoreDisplayRef.current) {
            scoreDisplayRef.current.innerText = Math.floor(visualScoreRef.current).toString().padStart(7, '0');
        }
    }, [rendering, gameTimeRef, scoreRef]);
    // ── AUDIO LIFECYCLE (ORCHESTRATOR OWNED) ──
    // 1. One-time Binding of Beat/Bar events
    useEffect(() => {
        // Use a closure variable or ref to check status inside the callback
        // We can't access 'status' directly here without re-binding on every change
        // So we rely on the FX system being safe to call anytime.
        audio.onBeat(() => {
            // Visual beat sync
            fx.pulseBeat();
        });
        audio.onBar(() => {
            // Visual bar sync
            fx.pulseBar();
        });
        return () => audio.clearCallbacks();
    }, [fx]);
    // 2. Centralized Audio Lifecycle
    useEffect(() => {
        switch (status) {
            case GameStatus.DIFFICULTY_SELECT:
                // Start procedural music on title/select
                audio.resume();
                audio.setMode('MENU');
                audio.startMusic();
                break;
            case GameStatus.PLAYING:
                audio.setMode('GAME'); // Switch to reactive game music
                break;
            case GameStatus.IDLE:
            case GameStatus.GAME_OVER:
                // Stop music on non-active states
                audio.stopMusic();
                break;
            case GameStatus.STAGE_TRANSITION:
            case GameStatus.RESUMING:
            case GameStatus.LEVEL_UP:
            case GameStatus.PAUSED:
            case GameStatus.CHARACTER_SELECT:
                // Keep music running in these states, but SILENCE ACTION LOOPS
                // Since the game loop pauses, updateMusic won't run to clear flags.
                // We must explicitly stop the hacking drone.
                audio.setHackProgress(0);
                break;
        }
    }, [status]);
    /* ─────────────────────────────
       INPUT
       ───────────────────────────── */
    const handleStartClick = useCallback(() => {
        setStatus(GameStatus.DIFFICULTY_SELECT);
        // audio lifecycle handled by effect
    }, [setStatus]);
    useInput(game, progression.applyUpgrade, combat.triggerSystemShock, combat.triggerChronoSurge, handleStartClick);
    /* ─────────────────────────────
       DIFFICULTY / CHARACTER
       ───────────────────────────── */
    const handleDifficultySelect = useCallback((id) => {
        setDifficulty(id);
        audio.setDifficulty(id); // Configure audio engine
        setStatus(GameStatus.CHARACTER_SELECT);
    }, [setDifficulty, setStatus]);
    const selectCharacter = useCallback((char) => {
        setSelectedChar(char);
        resetGame(char);
        setStatus(GameStatus.PLAYING);
    }, [setSelectedChar, resetGame, setStatus]);
    const toggleMute = useCallback(() => {
        const muted = audio.toggleMute();
        setIsMuted(!!muted);
    }, [setIsMuted]);
    /* ─────────────────────────────
       RESUME COUNTDOWN
       ───────────────────────────── */
    useEffect(() => {
        if (status === GameStatus.RESUMING) {
            if (resumeCountdown > 0) {
                const timer = setTimeout(() => {
                    setResumeCountdown(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            }
            else {
                setStatus(GameStatus.PLAYING);
            }
        }
    }, [status, resumeCountdown, setResumeCountdown, setStatus]);
    /* ─────────────────────────────
       STAGE TRANSITION
       ───────────────────────────── */
    useEffect(() => {
        if (status !== GameStatus.STAGE_TRANSITION)
            return;
        // NOTE: timestamp is set in stageController to be frame-perfect
        audio.play('POWER_UP');
        const timer = setTimeout(stage.advanceStage, TRANSITION_DURATION);
        return () => clearTimeout(timer);
    }, [status, stage]);
    /* ─────────────────────────────
       HIGH SCORE PERSISTENCE
       ───────────────────────────── */
    useEffect(() => {
        if (status === GameStatus.GAME_OVER) {
            if (scoreRef.current > highScore) {
                const final = Math.floor(scoreRef.current);
                setHighScore(final);
                localStorage.setItem('snake_highscore', final.toString());
            }
        }
    }, [status, highScore, setHighScore, scoreRef]);
    /* ─────────────────────────────
       AUTHORITATIVE UPDATE
       ───────────────────────────── */
    const update = useCallback((dt) => {
        // 1. TIMERS (Orchestrator Managed)
        if (invulnerabilityTimeRef.current > 0) {
            invulnerabilityTimeRef.current = Math.max(0, invulnerabilityTimeRef.current - dt);
        }
        // 2. SIMULATION (State Updates Only - NO Audio/UI/Cleanup)
        collisions.updateTerminals(dt);
        spawner.update(dt);
        combat.update(dt);
        progression.applyPassiveScore(dt);
        const head = game.snakeRef.current[0];
        if (head) {
            movement.updateEnemies(dt, head);
        }
        collisions.checkDynamicCollisions();
        // Snake Movement & Static Collisions
        const newHead = movement.getNextHead(dt);
        if (newHead) {
            const hit = collisions.checkMoveCollisions(newHead);
            if (!hit) {
                const grew = collisions.handleEat(newHead);
                movement.commitMove(newHead, grew);
            }
        }
        // 3. INTENT CONSUMPTION & ORCHESTRATION (React to Flags)
        stage.cacheBossRef();
        stage.checkStageCompletion();
        // ── REACTIVE AUDIO ORCHESTRATION ──
        // Delegate to Music System (Calculates parameters only)
        music.updateMusic();
        // Discrete Audio Events
        terminalsRef.current.forEach(t => {
            if (t.justDisconnected) {
                audioEventsRef.current.push({ type: 'HACK_LOST' });
                t.justDisconnected = false;
            }
            if (t.justCompleted) {
                audioEventsRef.current.push({ type: 'HACK_COMPLETE' });
                t.justCompleted = false;
            }
        });
        // Audio Event Queue
        if (audioEventsRef.current.length > 0) {
            const events = audioEventsRef.current;
            audioEventsRef.current = []; // clear first
            events.forEach(evt => {
                audio.play(evt.type, evt.data);
            });
        }
        // 4. FX UPDATE
        fx.tickTranslation(dt);
        fx.updateFX();
        // 5. DEFERRED ENTITY CLEANUP
        spawner.cleanupFood();
        spawner.pruneEnemies();
        foodRef.current = foodRef.current.filter(f => !f.shouldRemove);
        enemiesRef.current = enemiesRef.current.filter(e => !e.shouldRemove);
        terminalsRef.current = terminalsRef.current.filter(t => !t.shouldRemove);
        projectilesRef.current = projectilesRef.current.filter(p => !p.shouldRemove);
        minesRef.current = minesRef.current.filter(m => !m.shouldRemove);
        shockwavesRef.current = shockwavesRef.current.filter(s => !s.shouldRemove);
        lightningArcsRef.current = lightningArcsRef.current.filter(l => !l.shouldRemove);
        particlesRef.current = particlesRef.current.filter(p => !p.shouldRemove);
        floatingTextsRef.current = floatingTextsRef.current.filter(t => !t.shouldRemove);
    }, [game, music, collisions, spawner, combat, progression, fx, movement, stage]); // CRITICAL: Dependencies added to prevent stale closure!
    /* ─────────────────────────────
       GAME LOOP
       ───────────────────────────── */
    useGameLoop(game, update, draw);
    /* ─────────────────────────────
       UI STATE
       ───────────────────────────── */
    const currentTheme = STAGE_THEMES[((uiStage - 1) % 4) + 1] || STAGE_THEMES[1];
    const isChronoReady = gameTimeRef.current > abilityCooldownsRef.current.chrono;
    const isPingReady = gameTimeRef.current > abilityCooldownsRef.current.ping;
    const isShockReady = gameTimeRef.current > abilityCooldownsRef.current.systemShock;
    const getComboPct = (now, lastEat) => Math.min(1, Math.max(0, 1 - (now - lastEat) / COMBO_DECAY_DURATION));
    const comboPct = uiCombo > 1
        ? getComboPct(game.gameTimeRef.current, game.lastEatTimeRef.current)
        : 0;
    const handleCanvasClick = useCallback((e) => {
        if (status !== GameStatus.PLAYING)
            return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const gridX = (x * scaleX) / DEFAULT_SETTINGS.gridSize;
        const gridY = (y * scaleY) / DEFAULT_SETTINGS.gridSize;
        combat.triggerTacticalPing(gridX, gridY);
    }, [status, combat]);
    // Mobile directional input
    const handleMobileControl = useCallback((dir) => {
        if (status !== GameStatus.PLAYING)
            return;
        game.directionQueueRef.current.push(dir);
    }, [status, game]);
    // Mobile EMP button
    const handleMobileEMP = useCallback(() => {
        if (status !== GameStatus.PLAYING)
            return;
        combat.triggerSystemShock();
    }, [status, combat]);
    /* ─────────────────────────────
       RENDER
       ───────────────────────────── */
    return (_jsxs("div", { className: "relative w-full h-full bg-[#050505] flex flex-col items-center justify-center p-2 overflow-hidden selection:bg-cyan-500/30", children: [_jsxs("div", { className: "w-full max-w-[800px] grid grid-cols-12 gap-4 mb-4 items-end relative z-10", children: [_jsxs("div", { className: "col-span-3 flex flex-col items-start", children: [_jsx("div", { className: "text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1", children: "RUNTIME_METRICS" }), _jsxs("div", { className: "relative group", children: [_jsx("div", { ref: scoreDisplayRef, className: "text-4xl font-display text-white tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]", children: "0000000" }), _jsx("div", { className: "h-1.5 w-full bg-gray-900 mt-1 relative overflow-hidden rounded-sm", children: uiCombo > 1 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute inset-0 bg-purple-500/20 animate-pulse" }), _jsx("div", { className: "h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(192,38,211,0.6)]", style: { width: `${comboPct * 100}%` } })] })) }), _jsxs("div", { className: "flex justify-between items-center mt-1", children: [_jsx("span", { className: "text-[9px] text-gray-500 font-mono", children: "MULTIPLIER" }), _jsxs("span", { className: `text-xs font-bold font-mono ${uiCombo > 1 ? 'text-purple-400 animate-pulse' : 'text-gray-700'}`, children: ["x", uiCombo, ".0"] })] })] })] }), _jsxs("div", { className: "col-span-6 flex flex-col items-center justify-end pb-1", children: [bossActive && bossEnemyRef && bossEnemyRef.current ? (_jsxs("div", { className: "w-full mb-2 animate-in fade-in zoom-in duration-300", children: [_jsxs("div", { className: "flex justify-between text-[9px] text-red-400 font-bold tracking-widest mb-1 px-1", children: [_jsx("span", { className: "animate-pulse", children: "\u26A0 THREAT DETECTED" }), _jsxs("span", { children: [(bossEnemyRef.current.hp / bossEnemyRef.current.maxHp * 100).toFixed(0), "% INTEGRITY"] })] }), _jsxs("div", { className: "h-3 w-full bg-red-950/50 border border-red-600/50 relative overflow-hidden skew-x-[-10deg]", children: [_jsx("div", { className: "h-full bg-red-600 transition-all duration-200", style: { width: `${(bossEnemyRef.current.hp / bossEnemyRef.current.maxHp) * 100}%` } }), _jsx("div", { className: "absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20" })] })] })) : (_jsxs("div", { className: "flex flex-col items-center mb-2", children: [_jsxs("div", { className: "text-[10px] text-cyan-600 font-mono tracking-widest mb-0.5", children: ["STAGE ", uiStage.toString().padStart(2, '0'), " // ", DIFFICULTY_CONFIGS[difficulty].label] }), _jsxs("div", { className: `text-xs font-bold tracking-[0.2em] uppercase ${getThreatLevel(uiStage) === "EXTREME" ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" :
                                            getThreatLevel(uiStage) === "HIGH" ? "text-orange-400" :
                                                getThreatLevel(uiStage) === "MODERATE" ? "text-yellow-300" : "text-emerald-400"}`, children: ["THREAT: ", getThreatLevel(uiStage)] })] })), _jsxs("div", { className: "w-full max-w-[300px] group relative", children: [_jsxs("div", { className: "flex justify-between text-[9px] text-gray-500 font-mono mb-0.5 px-0.5 uppercase", children: [_jsxs("span", { children: ["Lv.", uiLevel] }), _jsx("span", { children: "Upgrade Imminent" }), _jsxs("span", { children: ["Lv.", uiLevel + 1] })] }), _jsx("div", { className: "h-1.5 w-full bg-gray-800 border border-gray-700 relative overflow-hidden rounded-full", children: _jsx("div", { className: "h-full bg-gradient-to-r from-yellow-600 to-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all duration-500 ease-out", style: { width: `${uiXp}%` } }) })] }), _jsxs("div", { className: "flex gap-2 mt-2 h-5", children: [isShockReady && (_jsxs("div", { className: "flex items-center gap-1 px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-500/30 rounded text-[9px] text-cyan-300 animate-pulse", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]" }), "EMP_READY"] })), uiShield && (_jsxs("div", { className: "flex items-center gap-1 px-1.5 py-0.5 bg-blue-950/40 border border-blue-500/30 rounded text-[9px] text-blue-300", children: [_jsx("span", { className: "text-[10px]", children: "\uD83D\uDEE1\uFE0F" }), " SHIELD"] })), activePowerUps.slow && (_jsx("div", { className: "px-1.5 py-0.5 bg-indigo-950/40 border border-indigo-500/30 rounded text-[9px] text-indigo-300", children: "CHRONO" })), activePowerUps.magnet && (_jsx("div", { className: "px-1.5 py-0.5 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded text-[9px] text-fuchsia-300", children: "MAGNET" }))] })] }), _jsxs("div", { className: "col-span-3 flex flex-col items-end", children: [_jsx("div", { className: "text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1", children: "PEAK_PERFORMANCE" }), _jsx("div", { className: "text-xl font-mono text-gray-400 mb-2", children: highScore.toString().padStart(7, '0') }), _jsx("div", { className: "text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1", children: "CURRENT_RUNTIME" }), _jsx("div", { className: "text-xl font-mono text-white mb-2", ref: timerRef, children: "00:00.00" }), _jsxs("div", { className: "mt-auto text-[10px] text-right text-gray-600 font-mono leading-tight", children: ["SESSION_ID: ", _jsx("span", { className: "text-gray-500", children: game.startTimeRef.current.toString(36).toUpperCase().slice(-6) }), _jsx("br", {}), "PROTOCOL: ", _jsx("span", { className: game.selectedChar ? "text-cyan-400" : "text-gray-500", children: game.selectedChar?.name || 'N/A' })] })] })] }), _jsxs("div", { className: "relative group p-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-gray-700", style: { borderColor: currentTheme.wall }, children: [_jsx("div", { className: "absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500 m-1" }), _jsx("div", { className: "absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500 m-1" }), _jsx("div", { className: "absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500 m-1" }), _jsx("div", { className: "absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500 m-1" }), _jsx("canvas", { ref: canvasRef, onClick: handleCanvasClick, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, className: "block max-w-full max-h-[70vh] w-auto h-auto cursor-crosshair rounded bg-black shadow-inner" }), _jsx("div", { className: "scanlines pointer-events-none rounded opacity-50" }), status === GameStatus.IDLE && (_jsxs("div", { className: "absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-sm p-6 text-center", children: [_jsx("h1", { className: "text-5xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] text-center tracking-tighter", children: "NEON SNAKE" }), _jsx("div", { className: "text-center mb-10 text-cyan-500/50 text-[10px] tracking-[0.4em] uppercase", children: "CYBER_PROTOCOL // ENHANCED_CORE_V1.1" }), _jsx("button", { onClick: handleStartClick, className: "px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-display rounded transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] group relative overflow-hidden", style: { clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }, children: "INITIALIZE_SYSTEM" })] })), status === GameStatus.DIFFICULTY_SELECT && (_jsx("div", { className: "absolute inset-0 bg-black/95 flex flex-col items-center z-30 backdrop-blur-md p-4 overflow-y-auto", children: _jsxs("div", { className: "my-auto w-full flex flex-col items-center", children: [_jsx("h2", { className: "text-2xl md:text-4xl font-display text-white mb-6 tracking-wide text-center", children: "THREAT_LEVEL_ASSESSMENT" }), _jsx("div", { className: "grid grid-cols-1 gap-3 w-full max-w-xl", children: Object.values(DIFFICULTY_CONFIGS).map(config => {
                                        const isUnlocked = unlockedDifficulties.includes(config.id);
                                        return (_jsxs("button", { disabled: !isUnlocked, onClick: () => handleDifficultySelect(config.id), className: `flex flex-col items-start p-5 border transition-all relative overflow-hidden group ${isUnlocked ? `border-gray-700 hover:border-white bg-gray-900/60 hover:bg-gray-800` : `border-gray-900 bg-black/80 opacity-60 cursor-not-allowed`}`, children: [_jsxs("div", { className: "flex justify-between w-full items-center mb-2", children: [_jsxs("h3", { className: `text-xl md:text-2xl font-bold font-display ${isUnlocked ? config.color : 'text-gray-600'}`, children: [" ", config.label, " "] }), !isUnlocked && _jsx("span", { className: "text-[10px] text-red-600 font-bold border border-red-900 px-2 py-0.5", children: "LOCKED" })] }), _jsx("p", { className: "text-sm text-gray-400 font-mono tracking-tight text-left", children: config.description }), !isUnlocked && (_jsx("div", { className: "mt-3 w-full border-t border-red-900/30 pt-2 text-left", children: _jsxs("p", { className: "text-xs text-red-500/80 font-mono uppercase tracking-wider", children: [_jsx("span", { className: "text-red-700 mr-2", children: "\u26A0 REQUIRED:" }), config.unlockCondition] }) }))] }, config.id));
                                    }) })] }) })), status === GameStatus.CHARACTER_SELECT && (_jsxs("div", { className: "absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-md p-4 overflow-y-auto", children: [_jsx("h2", { className: "text-3xl md:text-5xl font-display text-cyan-400 mb-6 tracking-widest mt-8 md:mt-0", children: "PROTOCOL_SELECTION" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl", children: CHARACTERS.map(char => (_jsxs("button", { onClick: () => selectCharacter(char), className: "flex flex-col items-start p-5 border-2 transition-all bg-gray-900/70 hover:bg-gray-800 hover:scale-[1.02] group relative overflow-hidden", style: { borderColor: char.color }, children: [_jsxs("div", { className: "flex justify-between w-full items-center mb-2", children: [_jsx("h3", { className: "text-2xl font-bold font-display", style: { color: char.color }, children: char.name }), _jsxs("span", { className: `text-[9px] font-bold px-2 py-0.5 border border-white/10 rounded uppercase ${char.tag === 'STABLE' ? 'text-blue-300' : char.tag === 'ADAPTIVE' ? 'text-green-300' : 'text-red-400'}`, children: [" ", char.tag, " "] })] }), _jsx("p", { className: "text-sm text-gray-400 mb-4 font-mono leading-snug text-left", children: char.description }), _jsxs("div", { className: "mt-auto w-full text-left", children: [_jsx("div", { className: "text-xs font-bold text-white mb-2 uppercase tracking-tighter", children: char.payoff }), _jsx("div", { className: "h-0.5 w-full bg-gray-800 mb-3" }), char.initialStats.weapon && _jsx("div", { className: "text-[10px] text-gray-500 uppercase", children: "Loadout: Optimized" }), char.initialStats.shieldActive && _jsx("div", { className: "text-[10px] text-cyan-500 font-bold uppercase", children: "Shield: Primed" })] })] }, char.id))) })] })), status === GameStatus.LEVEL_UP && (_jsxs("div", { className: "absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-40 backdrop-blur-lg p-10", children: [_jsx("h2", { className: "text-5xl font-display text-yellow-400 mb-2 animate-pulse tracking-tighter", children: "AUGMENTATION_READY" }), _jsx("p", { className: "text-gray-500 font-mono text-sm mb-12 tracking-widest uppercase", children: "Decryption successful // Choose modification" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl", children: upgradeOptions.map((opt, idx) => (_jsxs("button", { onClick: () => progression.applyUpgrade(opt.id), className: "flex flex-col p-8 bg-gray-900/80 border-2 border-gray-700 hover:border-white hover:bg-gray-800 transition-all text-left group relative", children: [_jsx("div", { className: "absolute -top-3 -left-3 w-8 h-8 bg-black border-2 border-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-white group-hover:border-white", children: idx + 1 }), _jsx("div", { className: "text-4xl mb-4 self-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]", children: opt.icon }), _jsx("h3", { className: `text-2xl font-bold font-display mb-2 ${opt.color}`, children: opt.title }), _jsx("p", { className: "text-base text-gray-300 font-mono leading-relaxed", children: opt.description })] }, opt.id))) })] })), status === GameStatus.PAUSED && (_jsx("div", { className: "absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm", children: _jsx("div", { className: "text-5xl font-display text-white tracking-[0.5em] animate-pulse border-4 border-white p-8", children: "SUSPENDED" }) })), status === GameStatus.GAME_OVER && (_jsxs("div", { className: "absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 backdrop-blur-md p-10", children: [_jsx("h2", { className: "text-6xl font-display text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(255,0,0,0.6)] tracking-tighter", children: "CONTAINMENT_FAILURE" }), _jsx("p", { className: "text-red-400 font-mono text-sm mb-10 tracking-[0.3em] uppercase", children: failureMessageRef.current }), _jsxs("div", { className: "w-full max-w-lg bg-black/60 border-2 border-red-900 p-6 mb-12 font-mono text-base shadow-2xl", children: [_jsx("div", { className: "text-red-500 border-b-2 border-red-900 pb-3 mb-4 font-bold tracking-widest uppercase", children: "POST_MORTEM_REPORT" }), _jsxs("div", { className: "flex justify-between mb-2", children: [" ", _jsx("span", { className: "text-gray-500", children: "RUNTIME:" }), " ", _jsx("span", { className: "text-white font-bold", children: formatTime(game.gameTimeRef.current, true) }), " "] }), _jsxs("div", { className: "flex justify-between mb-2", children: [" ", _jsx("span", { className: "text-gray-500", children: "NEUTRALIZED_DRONES:" }), " ", _jsx("span", { className: "text-white font-bold", children: enemiesKilledRef.current }), " "] }), _jsxs("div", { className: "flex justify-between mb-2", children: [" ", _jsx("span", { className: "text-gray-500", children: "ACCESSED_TERMINALS:" }), " ", _jsx("span", { className: "text-white font-bold", children: terminalsHackedRef.current }), " "] }), _jsxs("div", { className: "flex justify-between", children: [" ", _jsx("span", { className: "text-gray-500", children: "ANOMALY_STATUS:" }), " ", _jsx("span", { className: "text-red-400 font-black animate-pulse uppercase", children: "BREACHED" }), " "] })] }), _jsxs("div", { className: "flex gap-6", children: [_jsx("button", { onClick: handleStartClick, className: "px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold font-display rounded shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-transform transform hover:scale-105", children: " ROLLBACK " }), _jsx("button", { onClick: () => setStatus(GameStatus.IDLE), className: "px-10 py-4 border-2 border-red-800 hover:bg-red-900/50 text-red-400 font-display rounded transition-colors uppercase", children: " CONSOLE " })] })] })), status === GameStatus.RESUMING && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/10", children: _jsxs("div", { className: "text-[200px] font-black text-white/20 animate-ping font-display", children: [" ", resumeCountdown, " "] }) })), status === GameStatus.STAGE_TRANSITION && (_jsxs("div", { className: "absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-50", children: [_jsx("h2", { className: "text-6xl font-display text-cyan-400 mb-4 tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]", children: "SECTOR DECRYPTED" }), _jsx("div", { className: "text-cyan-400/80 font-mono text-sm tracking-[0.5em] uppercase bg-black/60 px-4 py-2 border-l-2 border-r-2 border-cyan-500/50", children: "INITIATING DATA MIGRATION..." })] }))] }), _jsxs("div", { className: "w-full max-w-[400px] mt-6 grid grid-cols-3 gap-3 md:hidden h-40 select-none", children: [_jsx("div", { className: "col-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30", onPointerDown: (e) => { e.preventDefault(); handleMobileControl(Direction.UP); }, children: _jsx("span", { className: "text-2xl text-cyan-400", children: "\u25B2" }) }), _jsx("div", { className: "col-start-1 row-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30", onPointerDown: (e) => { e.preventDefault(); handleMobileControl(Direction.LEFT); }, children: _jsx("span", { className: "text-2xl text-cyan-400", children: "\u25C0" }) }), _jsx("div", { className: "col-start-2 row-start-2 bg-gradient-to-b from-red-900/40 to-red-950/60 rounded-lg border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-red-900/50 border border-red-900/50", onPointerDown: (e) => { e.preventDefault(); handleMobileEMP(); }, children: _jsx("span", { className: "font-bold text-red-400 tracking-tighter text-sm", children: "EMP" }) }), _jsx("div", { className: "col-start-3 row-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30", onPointerDown: (e) => { e.preventDefault(); handleMobileControl(Direction.RIGHT); }, children: _jsx("span", { className: "text-2xl text-cyan-400", children: "\u25B6" }) }), _jsx("div", { className: "col-start-2 row-start-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30", onPointerDown: (e) => { e.preventDefault(); handleMobileControl(Direction.DOWN); }, children: _jsx("span", { className: "text-2xl text-cyan-400", children: "\u25BC" }) })] }), _jsxs("div", { className: "mt-6 hidden md:flex w-full max-w-[800px] justify-between items-center text-[10px] text-gray-500 font-mono border-t border-gray-800/50 pt-4", children: [_jsxs("div", { className: "flex gap-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-cyan-700 font-bold tracking-wider mb-1", children: "NAVIGATION" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsxs("div", { className: "flex gap-1", children: [_jsx("span", { className: "px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "W" }), _jsx("span", { className: "px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "A" }), _jsx("span", { className: "px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "S" }), _jsx("span", { className: "px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "D" })] }), _jsx("span", { children: "OR ARROWS" })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-cyan-700 font-bold tracking-wider mb-1", children: "COMBAT" }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-2 py-0.5 rounded border transition-colors ${isShockReady ? "bg-cyan-900/50 border-cyan-500 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-500"}`, children: "SHIFT" }), _jsx("span", { children: "SYSTEM SHOCK" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "CLICK" }), _jsx("span", { children: "PING" })] })] })] })] }), _jsxs("div", { className: "flex flex-col gap-1 items-end", children: [_jsx("span", { className: "text-cyan-700 font-bold tracking-wider mb-1", children: "SYSTEM" }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-2 py-0.5 rounded border transition-colors ${isChronoReady ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" : "bg-gray-800 border-gray-700 text-gray-500"}`, children: "Q" }), _jsx("span", { children: "CHRONO" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300", children: "SPACE" }), _jsx("span", { children: "PAUSE" })] }), _jsx("div", { className: "flex items-center gap-2 cursor-pointer group", onClick: toggleMute, children: _jsx("span", { className: `px-2 py-0.5 rounded border transition-colors ${isMuted ? "bg-red-900/50 border-red-500 text-red-300" : "bg-gray-800 border-gray-700 text-gray-300 group-hover:border-white"}`, children: isMuted ? 'UNMUTE' : 'MUTE' }) })] })] })] })] }));
};
export default SnakeGame;
