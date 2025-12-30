
import { ArchiveCapabilities } from '../../../archive/types';
import { DisclosureLevel } from './caiTypes';

export const getDisclosureLevel = (caps: ArchiveCapabilities): DisclosureLevel => {
    switch (caps.aiModuleTier) {
        case 'ORACLE': return 'ELEVATED';
        case 'MISSING': return 'LIMITED';
        default: return 'RESTRICTED';
    }
};

export const checkDisclosure = (current: DisclosureLevel, required: DisclosureLevel): boolean => {
    const levels = ['RESTRICTED', 'LIMITED', 'ELEVATED'];
    return levels.indexOf(current) >= levels.indexOf(required);
};
