/**
 * Domain State Hooks - Barrel Export
 */

export { useSessionState } from './useSessionState';
export type { SessionState, UserSettings, DebugFlags } from './useSessionState';
export { DEFAULT_USER_SETTINGS } from './useSessionState';

export { usePlayerState } from './usePlayerState';
export type { PlayerState } from './usePlayerState';

export { useEntityState } from './useEntityState';
export type { EntityState } from './useEntityState';

export { useUIState } from './useUIState';
export type { UIState, UiStats, ViewportState, XpValues } from './useUIState';

export { useCameraState } from './useCameraState';
export type { CameraStateHook } from './useCameraState';

export { useWeaponTimers } from './useWeaponTimers';
export type { WeaponTimersState } from './useWeaponTimers';

export { useCosmeticState } from './useCosmeticState';
export type { CosmeticState } from './useCosmeticState';
