
import { createContext } from 'react';
import { VisionProtocol } from './VisionProtocol.types';

// Dummy component for default context value (prevents circular deps with real components)
const NoOp = () => null;

const DEFAULT_PROTOCOL: VisionProtocol = {
  id: 'default',
  label: 'Default',
  description: 'Fallback protocol',
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
    verbosity: 'low',
    persistPanels: false,
  },
  components: {
    WeaponBar: NoOp,
    UtilityBar: NoOp,
    InfoPanel: NoOp,
  },
  interactionModel: {
    hoverEnabled: true,
    focusNavigation: false,
    controllerHints: false,
  },
};

export const VisionProtocolContext = createContext<VisionProtocol>(DEFAULT_PROTOCOL);
