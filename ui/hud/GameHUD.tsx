import React from 'react';
import { useGameState } from '../../game/useGameState';
import { useHUDData } from './useHUDData';
import { HUDData, HUDConfig } from './types';
import { CyberLayout } from './layouts/CyberLayout';
import { Cyber2Layout } from './layouts/Cyber2Layout';
import { Cyber3Layout } from './layouts/Cyber3Layout';
import { Cyber4Layout } from './layouts/Cyber4Layout';
import { Cyber5Layout } from './layouts/Cyber5Layout';
import { Cyber6Layout } from './layouts/Cyber6Layout';
import { Cyber7Layout } from './layouts/Cyber7Layout';
import { RetroLayout } from './layouts/RetroLayout';
import { Retro2Layout } from './layouts/Retro2Layout';
import { Retro3Layout } from './layouts/Retro3Layout';
import { Retro4Layout } from './layouts/Retro4Layout';
import { Retro5Layout } from './layouts/Retro5Layout';
import { Retro6Layout } from './layouts/Retro6Layout';
import { Retro7Layout } from './layouts/Retro7Layout';
import { MinimalLayout } from './layouts/MinimalLayout';
import { Minimal2Layout } from './layouts/Minimal2Layout';
import { Minimal3Layout } from './layouts/Minimal3Layout';
import { Minimal4Layout } from './layouts/Minimal4Layout';
import { Minimal5Layout } from './layouts/Minimal5Layout';
import { Minimal6Layout } from './layouts/Minimal6Layout';
import { Minimal7Layout } from './layouts/Minimal7Layout';
import { RPGLayout } from './layouts/RPGLayout';
import { RPG2Layout } from './layouts/RPG2Layout';
import { RPG3Layout } from './layouts/RPG3Layout';
import { RPG4Layout } from './layouts/RPG4Layout';
import { RPG5Layout } from './layouts/RPG5Layout';
import { RPG6Layout } from './layouts/RPG6Layout';
import { RPG7Layout } from './layouts/RPG7Layout';
import { HoloLayout } from './layouts/HoloLayout';
import { Holo2Layout } from './layouts/Holo2Layout';
import { Holo3Layout } from './layouts/Holo3Layout';
import { Holo4Layout } from './layouts/Holo4Layout';
import { Holo5Layout } from './layouts/Holo5Layout';
import { Holo6Layout } from './layouts/Holo6Layout';
import { Holo7Layout } from './layouts/Holo7Layout';
import { MechLayout } from './layouts/MechLayout';
import { Mech2Layout } from './layouts/Mech2Layout';
import { Mech3Layout } from './layouts/Mech3Layout';
import { Mech4Layout } from './layouts/Mech4Layout';
import { Mech5Layout } from './layouts/Mech5Layout';
import { Mech6Layout } from './layouts/Mech6Layout';
import { Mech7Layout } from './layouts/Mech7Layout';
import { ArcadeLayout } from './layouts/ArcadeLayout';
import { Arcade2Layout } from './layouts/Arcade2Layout';
import { Arcade3Layout } from './layouts/Arcade3Layout';
import { Arcade4Layout } from './layouts/Arcade4Layout';
import { Arcade5Layout } from './layouts/Arcade5Layout';
import { Arcade6Layout } from './layouts/Arcade6Layout';
import { Arcade7Layout } from './layouts/Arcade7Layout';
import { GlassLayout } from './layouts/GlassLayout';
import { Glass2Layout } from './layouts/Glass2Layout';
import { Glass3Layout } from './layouts/Glass3Layout';
import { Glass4Layout } from './layouts/Glass4Layout';
import { Glass5Layout } from './layouts/Glass5Layout';
import { Glass6Layout } from './layouts/Glass6Layout';
import { Glass7Layout } from './layouts/Glass7Layout';

interface GameHUDViewProps {
    data: HUDData;
    config: HUDConfig;
    children?: React.ReactNode;
    showUI?: boolean;
}

export const GameHUDView: React.FC<GameHUDViewProps> = ({ data, config, children, showUI = true }) => {
  // Render the selected layout
  switch (config.layout) {
      case 'RETRO': return <RetroLayout data={data} config={config} showUI={showUI}>{children}</RetroLayout>;
      case 'RETRO2': return <Retro2Layout data={data} config={config} showUI={showUI}>{children}</Retro2Layout>;
      case 'RETRO3': return <Retro3Layout data={data} config={config} showUI={showUI}>{children}</Retro3Layout>;
      case 'RETRO4': return <Retro4Layout data={data} config={config} showUI={showUI}>{children}</Retro4Layout>;
      case 'RETRO5': return <Retro5Layout data={data} config={config} showUI={showUI}>{children}</Retro5Layout>;
      case 'RETRO6': return <Retro6Layout data={data} config={config} showUI={showUI}>{children}</Retro6Layout>;
      case 'RETRO7': return <Retro7Layout data={data} config={config} showUI={showUI}>{children}</Retro7Layout>;
      
      case 'ZEN': return <MinimalLayout data={data} config={config} showUI={showUI}>{children}</MinimalLayout>;
      case 'ZEN2': return <Minimal2Layout data={data} config={config} showUI={showUI}>{children}</Minimal2Layout>;
      case 'ZEN3': return <Minimal3Layout data={data} config={config} showUI={showUI}>{children}</Minimal3Layout>;
      case 'ZEN4': return <Minimal4Layout data={data} config={config} showUI={showUI}>{children}</Minimal4Layout>;
      case 'ZEN5': return <Minimal5Layout data={data} config={config} showUI={showUI}>{children}</Minimal5Layout>;
      case 'ZEN6': return <Minimal6Layout data={data} config={config} showUI={showUI}>{children}</Minimal6Layout>;
      case 'ZEN7': return <Minimal7Layout data={data} config={config} showUI={showUI}>{children}</Minimal7Layout>;

      case 'RPG': return <RPGLayout data={data} config={config} showUI={showUI}>{children}</RPGLayout>;
      case 'RPG2': return <RPG2Layout data={data} config={config} showUI={showUI}>{children}</RPG2Layout>;
      case 'RPG3': return <RPG3Layout data={data} config={config} showUI={showUI}>{children}</RPG3Layout>;
      case 'RPG4': return <RPG4Layout data={data} config={config} showUI={showUI}>{children}</RPG4Layout>;
      case 'RPG5': return <RPG5Layout data={data} config={config} showUI={showUI}>{children}</RPG5Layout>;
      case 'RPG6': return <RPG6Layout data={data} config={config} showUI={showUI}>{children}</RPG6Layout>;
      case 'RPG7': return <RPG7Layout data={data} config={config} showUI={showUI}>{children}</RPG7Layout>;

      case 'HOLO': return <HoloLayout data={data} config={config} showUI={showUI}>{children}</HoloLayout>;
      case 'HOLO2': return <Holo2Layout data={data} config={config} showUI={showUI}>{children}</Holo2Layout>;
      case 'HOLO3': return <Holo3Layout data={data} config={config} showUI={showUI}>{children}</Holo3Layout>;
      case 'HOLO4': return <Holo4Layout data={data} config={config} showUI={showUI}>{children}</Holo4Layout>;
      case 'HOLO5': return <Holo5Layout data={data} config={config} showUI={showUI}>{children}</Holo5Layout>;
      case 'HOLO6': return <Holo6Layout data={data} config={config} showUI={showUI}>{children}</Holo6Layout>;
      case 'HOLO7': return <Holo7Layout data={data} config={config} showUI={showUI}>{children}</Holo7Layout>;

      case 'INDUSTRIAL': return <MechLayout data={data} config={config} showUI={showUI}>{children}</MechLayout>;
      case 'INDUSTRIAL2': return <Mech2Layout data={data} config={config} showUI={showUI}>{children}</Mech2Layout>;
      case 'INDUSTRIAL3': return <Mech3Layout data={data} config={config} showUI={showUI}>{children}</Mech3Layout>;
      case 'INDUSTRIAL4': return <Mech4Layout data={data} config={config} showUI={showUI}>{children}</Mech4Layout>;
      case 'INDUSTRIAL5': return <Mech5Layout data={data} config={config} showUI={showUI}>{children}</Mech5Layout>;
      case 'INDUSTRIAL6': return <Mech6Layout data={data} config={config} showUI={showUI}>{children}</Mech6Layout>;
      case 'INDUSTRIAL7': return <Mech7Layout data={data} config={config} showUI={showUI}>{children}</Mech7Layout>;

      case 'ARCADE': return <ArcadeLayout data={data} config={config} showUI={showUI}>{children}</ArcadeLayout>;
      case 'ARCADE2': return <Arcade2Layout data={data} config={config} showUI={showUI}>{children}</Arcade2Layout>;
      case 'ARCADE3': return <Arcade3Layout data={data} config={config} showUI={showUI}>{children}</Arcade3Layout>;
      case 'ARCADE4': return <Arcade4Layout data={data} config={config} showUI={showUI}>{children}</Arcade4Layout>;
      case 'ARCADE5': return <Arcade5Layout data={data} config={config} showUI={showUI}>{children}</Arcade5Layout>;
      case 'ARCADE6': return <Arcade6Layout data={data} config={config} showUI={showUI}>{children}</Arcade6Layout>;
      case 'ARCADE7': return <Arcade7Layout data={data} config={config} showUI={showUI}>{children}</Arcade7Layout>;

      case 'GLASS': return <GlassLayout data={data} config={config} showUI={showUI}>{children}</GlassLayout>;
      case 'GLASS2': return <Glass2Layout data={data} config={config} showUI={showUI}>{children}</Glass2Layout>;
      case 'GLASS3': return <Glass3Layout data={data} config={config} showUI={showUI}>{children}</Glass3Layout>;
      case 'GLASS4': return <Glass4Layout data={data} config={config} showUI={showUI}>{children}</Glass4Layout>;
      case 'GLASS5': return <Glass5Layout data={data} config={config} showUI={showUI}>{children}</Glass5Layout>;
      case 'GLASS6': return <Glass6Layout data={data} config={config} showUI={showUI}>{children}</Glass6Layout>;
      case 'GLASS7': return <Glass7Layout data={data} config={config} showUI={showUI}>{children}</Glass7Layout>;

      case 'CYBER2': return <Cyber2Layout data={data} config={config} showUI={showUI}>{children}</Cyber2Layout>;
      case 'CYBER3': return <Cyber3Layout data={data} config={config} showUI={showUI}>{children}</Cyber3Layout>;
      case 'CYBER4': return <Cyber4Layout data={data} config={config} showUI={showUI}>{children}</Cyber4Layout>;
      case 'CYBER5': return <Cyber5Layout data={data} config={config} showUI={showUI}>{children}</Cyber5Layout>;
      case 'CYBER6': return <Cyber6Layout data={data} config={config} showUI={showUI}>{children}</Cyber6Layout>;
      case 'CYBER7': return <Cyber7Layout data={data} config={config} showUI={showUI}>{children}</Cyber7Layout>;
      
      case 'CYBER':
      default:
          return <CyberLayout data={data} config={config} showUI={showUI}>{children}</CyberLayout>;
  }
};

interface GameHUDProps {
    game: ReturnType<typeof useGameState>;
    children?: React.ReactNode;
    showUI?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({ game, children, showUI = true }) => {
  const data = useHUDData(game);
  const { settings } = game;
  const config = settings.hudConfig;

  return <GameHUDView data={data} config={config} showUI={showUI}>{children}</GameHUDView>;
};