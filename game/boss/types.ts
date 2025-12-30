
export type BossStateId = string;

export interface HitboxDef {
  tag: string; // Identifier for deterministic removal
  width: number; // Grid Units
  height: number; // Grid Units
  offsetX: number; // Relative to Boss X
  offsetY: number; // Relative to Boss Y
  damage: number;
  color: string;
}

export type BossIntent = 
  | { type: 'REQUEST_STATE_TRANSITION'; next: BossStateId }
  | { type: 'SPAWN_HITBOX'; hitboxDef: HitboxDef }
  | { type: 'DESPAWN_HITBOX'; tag: string }
  | { type: 'LOCK_CAMERA' }
  | { type: 'UNLOCK_CAMERA' };

export interface BossStateDef {
  id: BossStateId;
  duration: number; // ms
  next: BossStateId | null;
  onEnter?: BossIntent[];
  onExit?: BossIntent[];
  // Committed implied by structure
}

export type BossStateTable = Record<BossStateId, BossStateDef>;

export interface BossPhaseConfig {
    threshold: number; // HP Ratio (0.0 - 1.0)
    table: BossStateTable;
    entryState: BossStateId;
}

export interface BossConfig {
    id: string;
    name: string;
    phases: BossPhaseConfig[];
}
