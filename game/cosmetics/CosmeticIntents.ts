
export type CosmeticIntent =
  | { type: "UNLOCK_COSMETIC"; id: string }
  | { type: "QUEUE_COSMETIC_TOAST"; id: string }
  | { type: "CLEAR_TOAST"; id: string };
