
import { useContext } from 'react';
import { VisionProtocolContext } from './VisionProtocolContext';
import { VisionProtocol } from './VisionProtocol.types';

export function useVisionProtocol(): VisionProtocol {
  const context = useContext(VisionProtocolContext);
  if (!context) {
    throw new Error('useVisionProtocol must be used within a VisionProtocolProvider');
  }
  return context;
}
