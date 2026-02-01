/**
 * useSessionState - Session/Game Flow State
 * Handles: status, difficulty, modals, settings
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GameStatus, Difficulty, CharacterProfile, ModalState, MobileControlScheme, Point, AudioRequest } from '../../types';
import { HUDConfig, HUDLayoutMode } from '../../ui/hud/types';
import { VisionProtocolId } from '../../ui/vision/VisionProtocolRegistry';
import { DEFAULT_SETTINGS } from '../../constants';
import { loadCosmeticProfile, saveCosmeticProfile } from '../cosmetics/CosmeticProfile';
import { audio } from '../../utils/audio';

export interface UserSettings {
    skipCountdown: boolean;
    uiScale: number;
    gameScale: number;
    fxIntensity: number;
    screenShake: boolean;
    highContrast: boolean;
    crtEffect: boolean;
    reduceFlashing: boolean;
    invertRotation: boolean;
    musicVolume: number;
    sfxVolume: number;
    mobileControlScheme: MobileControlScheme;
    swipeBrakeBehavior: 'BUTTON' | 'HOLD';
    controlOpacity: number;
    controlPos: Point | null;
    isControlEditMode: boolean;
    visionProtocolId: VisionProtocolId;
    forceTouchControls: boolean;
    swapControls: boolean;
    customControlPositions: { joystick: Point; action: Point } | null;
    hudConfig: HUDConfig;
    snakeStyle: string;
    unlockCheckInterval?: number;
    fxThrottleInterval?: number;
}

export interface DebugFlags {
    godMode: boolean;
    showHitboxes: boolean;
    showPathing: boolean;
    disableSpawning: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
    skipCountdown: false,
    uiScale: 1.0,
    gameScale: 1.0,
    fxIntensity: 1.0,
    screenShake: true,
    highContrast: false,
    crtEffect: true,
    reduceFlashing: false,
    invertRotation: false,
    musicVolume: 0.3,
    sfxVolume: 0.4,
    mobileControlScheme: 'SWIPE',
    swipeBrakeBehavior: 'HOLD',
    controlOpacity: 0.8,
    controlPos: null,
    isControlEditMode: false,
    visionProtocolId: 'combat',
    forceTouchControls: true,
    swapControls: false,
    customControlPositions: null,
    hudConfig: {
        layout: 'CYBER',
        numberStyle: 'DIGITAL',
        theme: 'NEON',
        showAnimations: true,
        opacity: 1.0,
        visible: true,
        autoHide: false
    },
    snakeStyle: 'AUTO',
    unlockCheckInterval: DEFAULT_SETTINGS.unlockCheckInterval,
    fxThrottleInterval: DEFAULT_SETTINGS.fxThrottleInterval
};

export function useSessionState() {
    const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
    const [modalState, setModalState] = useState<ModalState>('NONE');

    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
    const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>([Difficulty.EASY]);

    const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);
    const [resumeCountdown, setResumeCountdown] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Run ID tracks game restarts
    const runIdRef = useRef(0);
    const settingsReturnRef = useRef<ModalState>('NONE');

    // Debug flags
    const debugFlagsRef = useRef<DebugFlags>({
        godMode: false,
        showHitboxes: false,
        showPathing: false,
        disableSpawning: false
    });

    // Game Time Tracker
    const gameTimeRef = useRef(0);
    const stageRef = useRef(1);
    const stageArmedRef = useRef(false);
    const stageReadyRef = useRef(false); // Added stageReadyRef
    const stageReadyTimeRef = useRef(0); // Added stageReadyTimeRef
    const startTimeRef = useRef(0); // Added startTimeRef
    const audioEventsRef = useRef<AudioRequest[]>([]);

    // Score & Progression Tracking
    const scoreRef = useRef(0);
    const stageScoreRef = useRef(0);
    const lastEatTimeRef = useRef(0);
    const pendingStatusRef = useRef<GameStatus | null>(null);
    const maxComboRef = useRef(0);
    const enemiesKilledRef = useRef(0);
    const terminalsHackedRef = useRef(0);
    const failureMessageRef = useRef('');
    const deathTimerRef = useRef(0);
    const transitionStartTimeRef = useRef(0);
    const bossOverrideTimerRef = useRef(0);

    // Lazy init settings from persistent profile
    const [settings, setSettings] = useState<UserSettings>(() => {
        const profile = loadCosmeticProfile();
        // Also check for saved control settings in localStorage
        let savedControls = null;
        try {
            const saved = localStorage.getItem('neon_snake_controls_v1');
            if (saved) savedControls = JSON.parse(saved);
        } catch (e) { }

        return {
            ...DEFAULT_USER_SETTINGS,
            snakeStyle: profile.equippedSkin || 'AUTO',
            hudConfig: {
                ...DEFAULT_USER_SETTINGS.hudConfig,
                layout: (profile.equippedHud as HUDLayoutMode) || 'CYBER'
            },
            ...savedControls // Merge saved control settings
        };
    });

    // Save control settings whenever they change
    useEffect(() => {
        const controlSettings = {
            mobileControlScheme: settings.mobileControlScheme,
            swipeBrakeBehavior: settings.swipeBrakeBehavior,
            forceTouchControls: settings.forceTouchControls,
            swapControls: settings.swapControls,
            customControlPositions: settings.customControlPositions,
            controlOpacity: settings.controlOpacity
        };
        localStorage.setItem('neon_snake_controls_v1', JSON.stringify(controlSettings));
    }, [settings.mobileControlScheme, settings.swipeBrakeBehavior, settings.forceTouchControls, settings.swapControls, settings.customControlPositions, settings.controlOpacity]);

    // Persist equipped cosmetics when settings change
    useEffect(() => {
        const current = loadCosmeticProfile();
        if (current.equippedSkin !== settings.snakeStyle || current.equippedHud !== settings.hudConfig.layout) {
            saveCosmeticProfile({
                ...current,
                equippedSkin: settings.snakeStyle,
                equippedHud: settings.hudConfig.layout
            });
        }
    }, [settings.snakeStyle, settings.hudConfig.layout]);

    // Modal Logic
    const openSettings = useCallback(() => {
        if (modalState === 'SETTINGS') return;
        settingsReturnRef.current = modalState;
        setModalState('SETTINGS');
        if (status === GameStatus.PLAYING) {
            setStatus(GameStatus.PAUSED);
        }
    }, [modalState, status]);

    const closeSettings = useCallback(() => {
        if (modalState !== 'SETTINGS') return;
        setSettings(s => ({ ...s, isControlEditMode: false }));
        setModalState(settingsReturnRef.current);
        if (settingsReturnRef.current === 'NONE' && status === GameStatus.PAUSED) {
            if (settings.skipCountdown) {
                setStatus(GameStatus.PLAYING);
            } else {
                setResumeCountdown(3);
                setStatus(GameStatus.RESUMING);
            }
        }
    }, [modalState, status, settings.skipCountdown]);

    const togglePause = useCallback((stageReadyRef?: React.RefObject<boolean>) => {
        if (modalState === 'SETTINGS') return;

        // Block pause during stage completion EXIT OPEN phase
        if (stageReadyRef?.current) return;

        if (status === GameStatus.PLAYING) {
            setStatus(GameStatus.PAUSED);
            setModalState('PAUSE');
        } else if (status === GameStatus.PAUSED && modalState === 'PAUSE') {
            setModalState('NONE');
            if (settings.skipCountdown) {
                setStatus(GameStatus.PLAYING);
            } else {
                setResumeCountdown(3);
                setStatus(GameStatus.RESUMING);
            }
        }
    }, [status, modalState, settings.skipCountdown]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (next) {
                audio.setVolume(0, 0);
            } else {
                audio.setVolume(settings.musicVolume, settings.sfxVolume);
            }
            return next;
        });
    }, [settings]);

    return {
        // Status
        status, setStatus,
        modalState, setModalState,

        // Difficulty
        difficulty, setDifficulty,
        unlockedDifficulties, setUnlockedDifficulties,

        // Character/Countdown
        selectedChar, setSelectedChar,
        resumeCountdown, setResumeCountdown,

        // Audio
        isMuted, setIsMuted,
        toggleMute,

        // Settings
        settings, setSettings,

        // Refs
        runIdRef,
        settingsReturnRef,
        debugFlagsRef,
        gameTimeRef,
        stageRef,
        stageArmedRef,
        stageReadyRef,
        stageReadyTimeRef,
        startTimeRef,
        audioEventsRef,

        // Score & Progression Refs
        scoreRef,
        stageScoreRef,
        lastEatTimeRef,
        pendingStatusRef,
        maxComboRef,
        enemiesKilledRef,
        terminalsHackedRef,
        failureMessageRef,
        deathTimerRef,
        transitionStartTimeRef,
        bossOverrideTimerRef,

        // Modal callbacks
        openSettings,
        closeSettings,
        togglePause
    };
}

export type SessionState = ReturnType<typeof useSessionState>;
