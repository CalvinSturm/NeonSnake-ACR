
import { GRID_COLS, GRID_ROWS, STAGE_THEMES, DEFAULT_SETTINGS } from '../constants';
import { Point, StageTheme } from '../types';

export const formatTime = (ms: number, includeMs: boolean = false): string => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  
  if (includeMs) {
      // Centiseconds (00-99)
      const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
      return `${m}:${s}.${cs}`;
  }
  
  return `${m}:${s}`;
};

export const getRandomPos = (snake: Point[], exclude: Point[] = [], walls: Point[] = []): Point | null => {
  let pos: Point;
  let collision;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_COLS),
      y: Math.floor(Math.random() * GRID_ROWS)
    };
    collision = snake.some(s => s.x === pos.x && s.y === pos.y) || 
                exclude.some(e => e.x === pos.x && e.y === pos.y) ||
                walls.some(w => w.x === pos.x && w.y === pos.y);
    attempts++;
  } while (collision && attempts < 100); 
  
  if (collision) return null; 
  return pos;
};

export const generateWalls = (stage: number): Point[] => {
    const walls: Point[] = [];
    if (stage % 4 === 0) return walls;
    if (stage <= 1) return walls;

    const patternType = stage % 4; 
    
    if (patternType === 2) {
        const numBlocks = 6 + stage;
        for(let i=0; i<numBlocks; i++) {
            const bx = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
            const by = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
            walls.push({x: bx, y: by}, {x: bx+1, y: by}, {x: bx, y: by+1}, {x: bx+1, y: by+1});
        }
    }
    else if (patternType === 3) {
        for(let y = 6; y < GRID_ROWS - 6; y += 8) {
             const gapStart = Math.floor(GRID_COLS * 0.2) + Math.floor(Math.random() * (GRID_COLS * 0.4));
             const gapWidth = 8;
             for(let x = 4; x < GRID_COLS - 4; x++) {
                 if (x < gapStart || x > gapStart + gapWidth) {
                     walls.push({x, y});
                 }
             }
        }
    }
    else if (patternType === 0) {
        const margin = 8; 
        for(let x = margin; x <= GRID_COLS - margin; x++) {
            if (Math.abs(x - GRID_COLS/2) > 5) {
                walls.push({x, y: margin}, {x, y: GRID_ROWS - margin});
            }
        }
        for(let y = margin; y <= GRID_ROWS - margin; y++) {
            if (Math.abs(y - GRID_ROWS/2) > 4) {
                walls.push({x: margin, y}, {x: GRID_COLS - margin, y});
            }
        }
    }
    
    // SAFE SPAWN RESOLVER: Enforce 3-tile radius around (10,10)
    // This satisfies "Bug 2: Stage 3 Spawns Block on Player"
    return walls.filter(w => {
        const distFromCenter = Math.abs(w.x - GRID_COLS/2) > 6 || Math.abs(w.y - GRID_ROWS/2) > 6;
        const distFromSpawn = Math.abs(w.x - 10) > 3 || Math.abs(w.y - 10) > 3;
        return distFromCenter && distFromSpawn;
    });
};

export const getTheme = (stage: number): StageTheme => {
    const idx = ((stage - 1) % 4) + 1;
    return STAGE_THEMES[idx];
};

export const getThreatLevel = (stage: number): string => {
    if (stage < 4) return "LOW";
    if (stage < 8) return "MODERATE";
    if (stage < 12) return "HIGH";
    return "EXTREME";
};
