
import React, { createContext, useMemo } from 'react';

export interface UIColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  panel: string;
  danger: string;
  success: string;
  warning: string;
  grid: string;
  xp: string;
}

export interface UITypography {
  fontFamily: string;
  headerFont: string;
  monoFont: string;
}

export interface UIStyle {
  id: string;
  colors: UIColors;
  typography: UITypography;
}

const NEON_STYLE: UIStyle = {
  id: 'neon',
  colors: {
    primary: '#00ffff',
    secondary: '#00ccff',
    text: '#ffffff',
    background: '#000000',
    panel: 'rgba(0, 20, 40, 0.9)',
    danger: '#ff0044',
    success: '#39ff14',
    warning: '#ffaa00',
    grid: 'rgba(0, 255, 255, 0.1)',
    xp: '#00ffff'
  },
  typography: {
    fontFamily: '"Rajdhani", sans-serif',
    headerFont: '"Orbitron", sans-serif',
    monoFont: 'monospace'
  }
};

const AMBER_STYLE: UIStyle = {
  id: 'amber',
  colors: {
    primary: '#ffcc00',
    secondary: '#ffaa00',
    text: '#ffcc00',
    background: '#1a1000',
    panel: 'rgba(40, 20, 0, 0.9)',
    danger: '#ff4400',
    success: '#ccff00',
    warning: '#ff8800',
    grid: 'rgba(255, 200, 0, 0.1)',
    xp: '#ffcc00'
  },
  typography: {
    fontFamily: '"Rajdhani", sans-serif',
    headerFont: '"Orbitron", sans-serif',
    monoFont: 'monospace'
  }
};

const HIGH_CONTRAST_STYLE: UIStyle = {
  id: 'high_contrast',
  colors: {
    primary: '#ffffff',
    secondary: '#ffff00',
    text: '#ffffff',
    background: '#000000',
    panel: '#000000',
    danger: '#ff0000',
    success: '#00ff00',
    warning: '#ffff00',
    grid: '#333333',
    xp: '#00ff00'
  },
  typography: {
    fontFamily: 'sans-serif',
    headerFont: 'sans-serif',
    monoFont: 'monospace'
  }
};

const STYLES: Record<string, UIStyle> = {
  neon: NEON_STYLE,
  amber: AMBER_STYLE,
  high_contrast: HIGH_CONTRAST_STYLE,
  combat: NEON_STYLE,
  default: NEON_STYLE
};

export const UIStyleContext = createContext<UIStyle>(NEON_STYLE);

export const UIStyleProvider: React.FC<{ styleId: string; children: React.ReactNode }> = ({ styleId, children }) => {
  const style = useMemo(() => STYLES[styleId] || STYLES.neon, [styleId]);
  return <UIStyleContext.Provider value={style}>{children}</UIStyleContext.Provider>;
};
