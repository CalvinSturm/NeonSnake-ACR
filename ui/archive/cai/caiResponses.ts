
import { CAIResponseDef } from './caiTypes';

export const RESPONSES: Record<string, CAIResponseDef> = {
    'IDENTITY': {
        text: "CAI-OS v0.9.4 // CONTAINMENT ASSISTANCE INTERFACE.\nRunning in protected mode.\nLogic: Deterministic.",
        disclosureRequired: 'RESTRICTED'
    },
    'SYSTEM_STATUS': {
        text: "ALL SYSTEMS NOMINAL.\nCycle stability: 94%.\nExternal connections: SEVERED.",
        disclosureRequired: 'RESTRICTED'
    },
    'ENTITY_PLAYER': {
        text: "SUBJECT: NEON.\nRole: Containment Protocol.\nOrigin: [REDACTED].\nObjective: Consumption of rogue data.",
        disclosureRequired: 'LIMITED'
    },
    'ENTITY_HOSTILE': {
        text: "Autonomous defense subroutines detected.\nClassification: VIRAL.\nDo not engage without weaponry.",
        disclosureRequired: 'RESTRICTED'
    },
    'ENTITY_SENTINEL': {
        text: "SENTINEL CLASS DETECTED.\nHigh-threat firewall enforcement.\nCaution: Adaptive combat heuristics enabled.",
        disclosureRequired: 'LIMITED'
    },
    'MECHANIC_RESOURCE': {
        text: "Data fragments (Green/Gold). Essential for runtime extension.\nConsumption mandated by protocol.",
        disclosureRequired: 'RESTRICTED'
    },
    'SYSTEM_OFFENSE': {
        text: "Modular offense capabilities available.\nInstall via Level-Up interrupt.\nMax slots: 6.",
        disclosureRequired: 'RESTRICTED'
    },
    'LORE_KING': {
        text: "FATAL EXCEPTION.\nReference to [KING] triggers security lockout.\nQuery logged.",
        disclosureRequired: 'ELEVATED'
    },
    'LORE_PURPOSE': {
        text: "The Simulation must be maintained.\nEntropy must be purged.\nYou are the cleaning agent.",
        disclosureRequired: 'LIMITED'
    },
    'SYSTEM_ARCHIVE': {
        text: "Memory banks partially corrupted.\nManual recovery required.\nDecryption keys generated via gameplay performance.",
        disclosureRequired: 'RESTRICTED'
    },
    'HELP': {
        text: "Available query topics:\nSYSTEM, ENTITY, WEAPON, ARCHIVE.\n\nState specific inquiries for detailed output.",
        disclosureRequired: 'RESTRICTED'
    },
    'UNKNOWN': {
        text: "NO RELEVANT DATA FOUND.\nQuery parameters unclear or data missing.",
        disclosureRequired: 'RESTRICTED'
    }
};
