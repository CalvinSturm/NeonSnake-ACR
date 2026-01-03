
import { ROOT_FILESYSTEM } from '../../../archive/data';

export const VIRTUAL_ROOT = "/HOME";

export interface VirtualDir {
  id: string;
  name: string;
  resolvesTo: string;
  icon: string;
  description: string;
  isRestricted?: boolean;
}

export const VIRTUAL_DIRECTORIES: Record<string, VirtualDir> = {
  ARCHIVE: {
    id: 'v_archive',
    name: 'ARCHIVE',
    resolvesTo: ROOT_FILESYSTEM.path,
    icon: '💽',
    description: 'Recovered Memory Modules'
  },
  SYSTEM: {
    id: 'v_system',
    name: 'SYSTEM',
    resolvesTo: '/system/diagnostics',
    icon: '⚙️',
    description: 'System Diagnostics',
    isRestricted: true
  },
  NET: {
    id: 'v_net',
    name: 'NET_LOGS',
    resolvesTo: '/system/logs/network',
    icon: '🌐',
    description: 'External Connections',
    isRestricted: true
  }
} as const;

export function resolveVirtualPath(path: string): { visiblePath: string; resolvedPath: string; isVirtualRoot: boolean } {
    if (path === VIRTUAL_ROOT || path === '/') {
        return { visiblePath: VIRTUAL_ROOT, resolvedPath: VIRTUAL_ROOT, isVirtualRoot: true };
    }
    
    // Check if path is a direct child of virtual root
    // e.g. /HOME/ARCHIVE
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'HOME' && parts[1]) {
        const key = parts[1].toUpperCase();
        if (key in VIRTUAL_DIRECTORIES) {
            return {
                visiblePath: `${VIRTUAL_ROOT}/${key}`,
                resolvedPath: VIRTUAL_DIRECTORIES[key].resolvesTo,
                isVirtualRoot: false
            };
        }
    }

    return {
        visiblePath: path,
        resolvedPath: path,
        isVirtualRoot: false
    };
}
