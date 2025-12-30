
import { useContext } from 'react';
import { UIStyleContext, UIStyle } from './UIStyleContext';

export function useUIStyle(): UIStyle {
  const context = useContext(UIStyleContext);
  if (!context) {
    throw new Error('useUIStyle must be used within a UIStyleProvider');
  }
  return context;
}
