
import React from 'react';

export interface VisionLayoutConfig {
  showWeaponBar: boolean;
  showUtilityBar: boolean;
  showXP: boolean;
  showStageStatus: boolean;
  showMetrics: boolean;
}

export interface VisionInfoBehavior {
  revealMode: 'always' | 'hover' | 'scan_only';
  verbosity: 'low' | 'medium' | 'high';
  persistPanels: boolean;
}

export interface VisionInteractionModel {
  hoverEnabled: boolean;
  focusNavigation: boolean;
  controllerHints: boolean;
}

export interface VisionProtocol {
  id: string;
  label: string;
  description: string;
  uiStyleId: string;
  layout: VisionLayoutConfig;
  infoBehavior: VisionInfoBehavior;
  interactionModel: VisionInteractionModel;
  components: {
    WeaponBar: React.FC<any>;
    UtilityBar: React.FC<any>;
    InfoPanel: React.FC<any>;
  };
}
