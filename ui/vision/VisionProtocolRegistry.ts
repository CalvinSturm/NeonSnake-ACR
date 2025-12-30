
import { VisionProtocol } from './VisionProtocol.types';

export type VisionProtocolId = 'default' | 'combat' | 'archive';

const NoOp = () => null;

const DEFAULT_PROTOCOL: VisionProtocol = {
  id: 'default',
  label: 'Standard Ops',
  description: 'Balanced HUD for general operation.',
  uiStyleId: 'neon',
  layout: {
    showWeaponBar: true,
    showUtilityBar: true,
    showXP: true,
    showStageStatus: true,
    showMetrics: false,
  },
  infoBehavior: {
    revealMode: 'hover',
    verbosity: 'medium',
    persistPanels: false,
  },
  interactionModel: {
    hoverEnabled: true,
    focusNavigation: true,
    controllerHints: true,
  },
  components: {
    WeaponBar: NoOp,
    UtilityBar: NoOp,
    InfoPanel: NoOp
  }
};

const COMBAT_PROTOCOL: VisionProtocol = {
  id: 'combat',
  label: 'Combat Awareness',
  description: 'High-contrast, peripheral-focused layout for maximum visibility.',
  uiStyleId: 'high_contrast',
  layout: {
    showWeaponBar: true,
    showUtilityBar: true,
    showXP: true,
    showStageStatus: true,
    showMetrics: true,
  },
  infoBehavior: {
    revealMode: 'always',
    verbosity: 'low',
    persistPanels: true,
  },
  interactionModel: {
    hoverEnabled: false,
    focusNavigation: false,
    controllerHints: false,
  },
  components: {
    WeaponBar: NoOp,
    UtilityBar: NoOp,
    InfoPanel: NoOp
  }
};

const ARCHIVE_PROTOCOL: VisionProtocol = {
  id: 'archive',
  label: 'Data Retrieval',
  description: 'Terminal interface for reading logs.',
  uiStyleId: 'amber',
  layout: {
    showWeaponBar: false,
    showUtilityBar: false,
    showXP: false,
    showStageStatus: false,
    showMetrics: false,
  },
  infoBehavior: {
    revealMode: 'always',
    verbosity: 'high',
    persistPanels: true,
  },
  interactionModel: {
    hoverEnabled: true,
    focusNavigation: true,
    controllerHints: true,
  },
  components: {
    WeaponBar: NoOp,
    UtilityBar: NoOp,
    InfoPanel: NoOp
  }
};

export const VISION_PROTOCOLS: Record<string, VisionProtocol> = {
  default: DEFAULT_PROTOCOL,
  combat: COMBAT_PROTOCOL,
  archive: ARCHIVE_PROTOCOL,
};
