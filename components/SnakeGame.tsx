
import React, { useRef, useEffect, useState } from 'react';
import { useGameState } from '../game/useGameState';
import { useProgression } from '../game/useProgression';
import { useSpawner } from '../game/useSpawner';
import { useFX } from '../game/useFX';
import { useCombat } from '../game/useCombat';
import { useCollisions } from '../game/useCollisions';
import { useMovement } from '../game/useMovement';
import { useStageController } from '../game/useStageController';
import { useGameLoop } from '../game/useGameLoop';
import { useRendering } from '../game/useRendering';
import { useInput } from '../game/useInput';
import { useMusic } from '../game/useMusic';
import { useAnalytics } from '../game/useAnalytics';
import { useBossController } from '../game/boss/useBossController';
import { useVoidHazard } from '../game/hazards/useVoidHazard';
import { useEnemyGapAwareness } from '../game/ai/useEnemyGapAwareness';
import { useProjectilePhysics } from '../game/physics/useProjectilePhysics';
import { audio } from '../utils/audio';

import { GameStatus, CharacterProfile, Direction, Difficulty } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, DIFFICULTY_CONFIGS } from '../constants';

import { GameHUD } from '../ui/hud/GameHUD';
import { GameOverScreen } from '../ui/screens/GameOverScreen';
import { SettingsMenu } from './SettingsMenu';
import { ArchiveTerminal } from './ArchiveTerminal';
import { CosmeticsMenu } from './CosmeticsMenu';
import { UnlockToast } from '../ui/cosmetics/UnlockToast';
import { BootSequence } from './BootSequence';
import { SwipeControls } from './SwipeControls';
import { VirtualJoystick } from './VirtualJoystick';
import { ArrowControls } from './ArrowControls';
import { BrakeButton } from './BrakeButton';
import { ModelConfigurationPass } from '../ui/transitions/ModelConfigurationPass';
import { VisionProtocolProvider } from '../ui/vision/VisionProtocolProvider';
import { UIStyleProvider } from '../ui/UIStyleContext';
import { evaluateUnlocks } from '../game/cosmetics/CosmeticUnlockSystem';
import { DevTools } from '../ui/devtools/DevTools';
import { CharacterSelectMenu } from './CharacterSelectMenu';
import { DifficultySelectMenu } from './DifficultySelectMenu';
import { LevelUpScreen } from './LevelUpScreen';
import { TitleScreen } from './TitleScreen';
import { ScreenTransition } from './ScreenTransition';

export const SnakeGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Core State
    const game = useGameState();
    const { 
        status, setStatus, 
        upgradeOptions, 
        modalState, setModalState,
        settings, setSettings,
        unlockedCosmetics,
        sessionNewUnlocks,
        toastQueue, clearToast,
        hasUnreadArchiveData
    } = game;

    // Sub-systems
    const fx = useFX(game);
    const spawner = useSpawner(game, fx.triggerShake);
    const progression = useProgression(game);
    const bossController = useBossController(game, spawner);
    const combat = useCombat(game, spawner, fx, progression);
    const collisions = useCollisions(game, combat, spawner, fx, progression);
    const movement = useMovement(game, spawner, bossController);
    const stageController = useStageController(game, spawner, fx, progression);
    const music = useMusic(game);
    const analytics = useAnalytics(game);
    
    // Physics & Hazards
    const voidHazard = useVoidHazard(game, collisions.handleDeath);
    const gapAwareness = useEnemyGapAwareness(game);
    const projectilePhysics = useProjectilePhysics(game);

    // Input & Loop
    const { handleInput } = useInput(game, progression.applyUpgrade, () => {
        // Handle Game Over "Press Start" behavior
        if (status === GameStatus.GAME_OVER) {
            game.resetGame(game.selectedChar || CHARACTERS[0]);
            game.stageArmedRef.current = true;
            setStatus(GameStatus.PLAYING);
        }
    });
    const { draw } = useRendering(canvasRef, game, movement.getMoveProgress);

    // Game Loop Update
    const update = (dt: number) => {
        // Audio
        music.updateMusic();
        
        // Process Queued Audio Events
        const audioEvents = game.audioEventsRef.current;
        while (audioEvents.length > 0) {
            const evt = audioEvents.shift();
            if (evt) {
                audio.play(evt.type, evt.data);
            }
        }

        if (status === GameStatus.DYING) {
             game.deathTimerRef.current -= dt;
             fx.tickTranslation(dt);
             fx.updateFX();

             // Ramp up glitch effect
             const progress = 1 - (Math.max(0, game.deathTimerRef.current) / 2000);
             game.chromaticAberrationRef.current = progress * 8; 

             if (game.deathTimerRef.current <= 0) {
                 setStatus(GameStatus.GAME_OVER);
                 game.chromaticAberrationRef.current = 0;
             }
             return;
        }

        // --- GAMEPLAY SIMULATION (Only when PLAYING) ---
        if (status === GameStatus.PLAYING) {
            // Physics Sub-steps
            projectilePhysics.update(dt);
            gapAwareness.update(dt);
            voidHazard.update();

            // 1. Movement & AI
            const nextHead = movement.getNextHead(dt);
            if (nextHead) {
                // 2. Pre-Collision (Walls/Self)
                if (collisions.checkMoveCollisions(nextHead)) {
                    return; // Death handled inside
                }
                
                // 3. Commit Move
                const grew = collisions.handleEat(nextHead);
                movement.commitMove(nextHead, grew);
                
                // Audio: Move
                audio.play('MOVE');
                
                // 4. Post-Move Checks (XP Collection)
                collisions.checkXPCollection();
            }

            // 5. Dynamic Entities
            movement.updateEnemies(dt, game.snakeRef.current[0]);
            combat.update(dt);
            collisions.checkDynamicCollisions();
            collisions.updateCollisionLogic(dt);
            
            // 6. Passive Systems (Score/Combo/Regen)
            progression.applyPassiveScore(dt);
            
            // 7. Spawning
            spawner.update(dt);
        }
        
        // 8. FX (Always run for visual continuity, even during transition)
        fx.tickTranslation(dt);
        fx.updateFX();
        
        // 9. Stage Logic (Handles checking for completion AND processing transition timer)
        stageController.cacheBossRef();
        stageController.checkStageCompletion();
        stageController.handleTransition();
    };

    useGameLoop(game, update, draw);

    // Cosmetic Unlock Check
    // We check on stage transitions AND game over to ensure players get instant feedback
    // Note: Ref values are read inside the effect, not tracked as dependencies.
    // The effect triggers on status change; refs provide current values at execution time.
    useEffect(() => {
        if (status === GameStatus.STAGE_TRANSITION || status === GameStatus.GAME_OVER) {
            const stats = {
                score: game.scoreRef.current,
                stage: game.stageRef.current,
                level: game.levelRef.current,
                maxCombo: game.maxComboRef.current,
                terminalsHacked: game.terminalsHackedRef.current,
                bossDefeated: game.bossDefeatedRef.current,
                integrity: game.tailIntegrityRef.current,
                xpOrbsCollected: 0,
                difficulty: game.difficulty
            };

            const newUnlocks = evaluateUnlocks(stats, unlockedCosmetics);
            newUnlocks.forEach(id => game.unlockCosmetic(id));
        }
    }, [status, game.difficulty, unlockedCosmetics, game.unlockCosmetic]);

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                // Ensure canvas resolution matches constants
                canvasRef.current.width = CANVAS_WIDTH;
                canvasRef.current.height = CANVAS_HEIGHT;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial Boot
    const [bootComplete, setBootComplete] = useState(false);
    
    if (!bootComplete) {
        return <BootSequence onComplete={() => setBootComplete(true)} />;
    }

    return (
        <UIStyleProvider styleId={settings.hudConfig.theme.toLowerCase()}>
            <VisionProtocolProvider protocolId={settings.visionProtocolId}>
                <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                    
                    {/* Render Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="block object-contain max-w-full max-h-full"
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
                            filter: settings.crtEffect ? 'contrast(1.1) brightness(1.1)' : 'none'
                        }}
                    />

                    {/* HUD Layer */}
                    {status === GameStatus.PLAYING || status === GameStatus.STAGE_TRANSITION || status === GameStatus.RESUMING || status === GameStatus.READY || status === GameStatus.DYING || status === GameStatus.GAME_OVER ? (
                        <div className="absolute inset-0 pointer-events-none">
                            <GameHUD game={game} showUI={status !== GameStatus.GAME_OVER && status !== GameStatus.DYING} />
                        </div>
                    ) : null}
                    
                    {/* READY Overlay - Appears after transition fades out */}
                    {status === GameStatus.READY && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in duration-500 delay-300 fill-mode-backwards">
                            <div className="bg-black/80 border-y-2 border-cyan-500 py-6 px-16 text-center shadow-[0_0_50px_rgba(0,255,255,0.2)] backdrop-blur-md">
                                <div className="text-xs font-mono text-cyan-400 tracking-[0.3em] mb-2 uppercase">
                                    System Active
                                </div>
                                <div className="text-5xl font-black font-display text-white tracking-widest animate-pulse">
                                    PRESS START
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile Controls Layer */}
                    {(status === GameStatus.PLAYING) && (
                        <div className="absolute inset-0 z-40 pointer-events-none">
                            <div className="pointer-events-auto w-full h-full relative">
                                {settings.mobileControlScheme === 'SWIPE' && (
                                    <SwipeControls 
                                        onDirection={handleInput} 
                                        onBrake={(active) => { game.stopIntentRef.current = active; }} 
                                        brakeMode={settings.swipeBrakeBehavior}
                                    />
                                )}
                                
                                {settings.mobileControlScheme === 'JOYSTICK' && (
                                    <>
                                        <div className={`absolute bottom-8 ${settings.swapControls ? 'right-8' : 'left-8'}`}>
                                            <VirtualJoystick onDirection={handleInput} />
                                        </div>
                                        <div className={`absolute bottom-10 ${settings.swapControls ? 'left-8' : 'right-8'}`}>
                                            <BrakeButton game={game} />
                                        </div>
                                    </>
                                )}

                                {settings.mobileControlScheme === 'ARROWS' && (
                                    <>
                                        <div className={`absolute bottom-8 ${settings.swapControls ? 'right-8' : 'left-8'}`}>
                                            <ArrowControls onDirection={handleInput} />
                                        </div>
                                        <div className={`absolute bottom-10 ${settings.swapControls ? 'left-8' : 'right-8'}`}>
                                            <BrakeButton game={game} />
                                        </div>
                                    </>
                                )}
                                
                                {/* Force Touch Controls Brake for Swipe */}
                                {settings.mobileControlScheme === 'SWIPE' && settings.swipeBrakeBehavior === 'BUTTON' && (
                                    <div className="absolute bottom-10 right-8">
                                        <BrakeButton game={game} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Game Over */}
                    {status === GameStatus.GAME_OVER && (
                        <GameOverScreen 
                            score={Math.floor(game.scoreRef.current)}
                            highScore={game.highScore}
                            stage={game.stageRef.current}
                            level={game.levelRef.current}
                            kills={game.enemiesKilledRef.current}
                            failureReason={game.failureMessageRef.current}
                            newUnlocks={sessionNewUnlocks}
                            onRestart={() => {
                                game.resetGame(game.selectedChar || CHARACTERS[0]);
                                game.stageArmedRef.current = true;
                                setStatus(GameStatus.PLAYING);
                            }}
                            onMenu={() => setStatus(GameStatus.IDLE)}
                            onCustomize={() => setStatus(GameStatus.COSMETICS)}
                        />
                    )}

                    {/* Level Up */}
                    {status === GameStatus.LEVEL_UP && (
                        <LevelUpScreen 
                            options={upgradeOptions}
                            onSelect={(id, rarity) => progression.applyUpgrade(id as any, rarity)}
                        />
                    )}

                    {/* Config Transition */}
                    {status === GameStatus.CONFIGURATION && (
                        <ModelConfigurationPass 
                            difficultyId={game.difficulty} 
                            onComplete={() => setStatus(GameStatus.CHARACTER_SELECT)} 
                        />
                    )}

                    {/* Character Select */}
                    {status === GameStatus.CHARACTER_SELECT && (
                        <CharacterSelectMenu 
                            onSelect={(char) => {
                                game.setSelectedChar(char);
                                game.resetGame(char);
                                game.stageArmedRef.current = true;
                                setStatus(GameStatus.PLAYING);
                            }} 
                        />
                    )}

                    {/* Difficulty Select */}
                    {status === GameStatus.DIFFICULTY_SELECT && (
                        <DifficultySelectMenu 
                            unlockedDifficulties={game.unlockedDifficulties}
                            onSelect={(diff) => {
                                game.setDifficulty(diff);
                                setStatus(GameStatus.CONFIGURATION);
                            }}
                            onBack={() => setStatus(GameStatus.IDLE)}
                        />
                    )}

                    {/* Archive Terminal */}
                    {status === GameStatus.ARCHIVE && (
                        <ArchiveTerminal onClose={() => setStatus(GameStatus.IDLE)} />
                    )}

                    {/* Cosmetics Menu */}
                    {status === GameStatus.COSMETICS && (
                        <CosmeticsMenu onClose={() => setStatus(GameStatus.IDLE)} />
                    )}

                    {/* Unlock Toast (In-Game) - Only renders active toasts */}
                    <UnlockToast queue={toastQueue} onClear={clearToast} />

                    {/* Main Menu (IDLE) */}
                    {status === GameStatus.IDLE && (
                        <TitleScreen 
                            onStart={() => setStatus(GameStatus.DIFFICULTY_SELECT)}
                            onArchive={() => setStatus(GameStatus.ARCHIVE)}
                            onCosmetics={() => setStatus(GameStatus.COSMETICS)}
                            onSettings={() => game.openSettings()}
                            hasUnreadArchive={hasUnreadArchiveData}
                        />
                    )}

                    {/* Settings Menu - Rendered late to ensure stacking context priority */}
                    {modalState === 'SETTINGS' && (
                        <SettingsMenu
                            settings={settings}
                            setSettings={setSettings}
                            onClose={game.closeSettings}
                            unlockedCosmetics={unlockedCosmetics}
                            cameraControlsEnabled={game.cameraControlsEnabled}
                            setCameraControlsEnabled={game.setCameraControlsEnabled}
                            onEditCamera={() => {
                                setStatus(GameStatus.CAMERA_EDIT);
                                setModalState('NONE');
                            }}
                        />
                    )}

                    {/* Pause Menu */}
                    {status === GameStatus.PAUSED && modalState === 'PAUSE' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60 backdrop-blur">
                            <div className="text-4xl font-bold text-white mb-8 tracking-[0.5em]">PAUSED</div>
                            <button onClick={game.togglePause} className="mb-4 text-cyan-400 hover:text-white font-bold tracking-widest text-xl">RESUME</button>
                            <button onClick={game.openSettings} className="mb-4 text-gray-400 hover:text-white font-bold tracking-widest text-sm">SETTINGS</button>
                            <button onClick={() => { setStatus(GameStatus.IDLE); setModalState('NONE'); }} className="text-red-500 hover:text-red-300 font-bold tracking-widest text-sm">ABORT MISSION</button>
                        </div>
                    )}

                    {/* Global Transition Overlay */}
                    <ScreenTransition 
                        status={status} 
                        // We predict the next stage number for the transition screen
                        // During STAGE_TRANSITION, stageRef hasn't updated yet (it updates at end of transition duration)
                        stage={game.stageRef.current + 1} 
                        difficulty={DIFFICULTY_CONFIGS[game.difficulty].label} 
                    />

                    {/* Dev Tools */}
                    <DevTools game={game} advanceStage={stageController.advanceStage} />

                </div>
            </VisionProtocolProvider>
        </UIStyleProvider>
    );
};
