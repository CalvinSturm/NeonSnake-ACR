import React, { useMemo } from 'react';
import { VisionProtocolContext } from './VisionProtocolContext';
import { VISION_PROTOCOLS, VisionProtocolId } from './VisionProtocolRegistry';

export const VisionProtocolProvider: React.FC<{
  protocolId: VisionProtocolId;
  children: React.ReactNode;
}> = ({
  protocolId,
  children,
}) => {
  const protocol = useMemo(() => VISION_PROTOCOLS[protocolId] || VISION_PROTOCOLS.combat, [protocolId]);

  return (
    <VisionProtocolContext.Provider value={protocol}>
      {children}
    </VisionProtocolContext.Provider>
  );
};