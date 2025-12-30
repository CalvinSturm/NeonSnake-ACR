
export type CAIStatus = 'IDLE' | 'PROCESSING';

export type DisclosureLevel = 'RESTRICTED' | 'LIMITED' | 'ELEVATED';

export type IntentCategory = 'SYSTEM' | 'MECHANIC' | 'WEAPON' | 'ENEMY' | 'LORE' | 'UI' | 'META' | 'UNKNOWN';

export interface Intent {
    id: string;
    category: IntentCategory;
    confidence: number;
}

export interface CAIResponseDef {
    text: string;
    disclosureRequired: DisclosureLevel;
}
