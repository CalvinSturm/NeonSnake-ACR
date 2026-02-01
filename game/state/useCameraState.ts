/**
 * useCameraState - Camera/Viewport State
 * Handles: camera position, zoom, mode transitions, floor volumes
 */

import { useRef, useState, useCallback } from 'react';
import { CameraMode, AudioRequest } from '../../types';
import { CameraState, CameraBehavior, CameraIntent } from '../camera/types';
import { useFloorVolumes } from '../floor/useFloorVolumes';
import { DEFAULT_SETTINGS } from '../../constants';

export function useCameraState() {
    // Camera controls toggle
    const [cameraControlsEnabled, setCameraControlsEnabled] = useState(false);

    // Camera state
    const cameraRef = useRef<CameraState>({
        mode: CameraMode.TOP_DOWN,
        behavior: CameraBehavior.FOLLOW_PLAYER,
        x: 0,
        y: 0,
        zoom: 1.25,
        tilt: 0,
        isLocked: false,
        scrollSpeed: 0,
        targetMode: null,
        transitionT: 0,
        transitionDuration: 1000
    });

    // Shared intent queue for camera
    const cameraIntentsRef = useRef<CameraIntent[]>([]);

    // Screen shake (camera offset)
    const shakeRef = useRef({ x: 0, y: 0 });

    // Floor volumes (composed hook)
    const floor = useFloorVolumes();

    /** Request camera mode switch */
    const requestCameraSwitch = useCallback((
        mode: CameraMode,
        durationMs: number = 1500,
        audioEventsRef: React.MutableRefObject<AudioRequest[]>
    ) => {
        const cam = cameraRef.current;
        if (cam.mode === mode && !cam.targetMode) return;
        if (cam.targetMode === mode) return;

        cam.targetMode = mode;
        cam.transitionT = 0;
        cam.transitionDuration = durationMs;

        audioEventsRef.current.push({ type: 'UI_HARD_CLICK' });
    }, []);

    /** Update camera (placeholder for complex logic) */
    const updateCamera = useCallback((dt: number) => {
        // Camera update logic handled elsewhere
    }, []);

    /** Reset camera for new game */
    const resetCamera = useCallback((startX: number, startY: number, viewportRows: number) => {
        const startPxX = startX * DEFAULT_SETTINGS.gridSize + (DEFAULT_SETTINGS.gridSize / 2);
        const startPxY = startY * DEFAULT_SETTINGS.gridSize + (DEFAULT_SETTINGS.gridSize / 2);

        cameraRef.current = {
            mode: CameraMode.TOP_DOWN,
            behavior: CameraBehavior.FOLLOW_PLAYER,
            x: startPxX,
            y: startPxY,
            zoom: 1.25,
            tilt: 0,
            isLocked: false,
            scrollSpeed: 0,
            targetMode: null,
            transitionT: 0,
            transitionDuration: 1000
        };

        cameraIntentsRef.current = [];

        // Reset floor
        floor.clearFloors();
        floor.addFloorVolume({
            id: 'default_floor',
            startX: -1000,
            endX: 100000,
            topY: viewportRows - 2
        });
    }, [floor]);

    return {
        // Controls
        cameraControlsEnabled, setCameraControlsEnabled,

        // Camera ref
        cameraRef,
        cameraIntentsRef,

        // Floor
        floor,

        // Methods
        requestCameraSwitch,
        updateCamera,
        resetCamera,
        shakeRef
    };
}

export type CameraStateHook = ReturnType<typeof useCameraState>;
