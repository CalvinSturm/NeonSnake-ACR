
import { GRID_COLS, GRID_ROWS, STAGE_THEMES, DEFAULT_SETTINGS } from '../constants';
import { Point, StageTheme } from '../types';

export const formatTime = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const getRandomPos = (snake: Point[], exclude: Point[] = [], walls: Point[] = [], cols: number = GRID_COLS, rows: number = GRID_ROWS): Point => {
  let pos: Point;
  let collision;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
    collision = snake.some(s => s.x === pos.x && s.y === pos.y) || 
                exclude.some(e => e.x === pos.x && e.y === pos.y) ||
                walls.some(w => w.x === pos.x && w.y === pos.y);
    attempts++;
  } while (collision && attempts < 100); 
  
  if (collision) return { x: 0, y: 0 }; 
  return pos;
};

export const generateWalls = (stage: number, cols: number = GRID_COLS, rows: number = GRID_ROWS): Point[] => {
    const walls: Point[] = [];
    
    // WARDEN ARENA (Stage 5) - OPEN ARENA
    if (stage === 5) {
        for(let x=0; x<cols; x++) {
            walls.push({x, y: 0});
            walls.push({x, y: rows - 1});
        }
        for(let y=1; y<rows-1; y++) {
            walls.push({x: 0, y});
            walls.push({x: cols - 1, y});
        }
        return walls;
    }

    if (stage % 5 === 0) return walls;
    if (stage <= 1) return walls;

    const patternType = stage % 4; 
    
    if (patternType === 2) {
        const numBlocks = 6 + stage;
        for(let i=0; i<numBlocks; i++) {
            const bx = Math.floor(Math.random() * (cols - 4)) + 2;
            const by = Math.floor(Math.random() * (rows - 4)) + 2;
            walls.push({x: bx, y: by}, {x: bx+1, y: by}, {x: bx, y: by+1}, {x: bx+1, y: by+1});
        }
    }
    else if (patternType === 3) {
        for(let y = 6; y < rows - 6; y += 8) {
             const gapStart = Math.floor(cols * 0.2) + Math.floor(Math.random() * (cols * 0.4));
             const gapWidth = 8;
             for(let x = 4; x < cols - 4; x++) {
                 if (x < gapStart || x > gapStart + gapWidth) {
                     walls.push({x, y});
                 }
             }
        }
    }
    else if (patternType === 0) {
        const margin = 8; 
        for(let x = margin; x <= cols - margin; x++) {
            if (Math.abs(x - cols/2) > 5) {
                walls.push({x, y: margin}, {x, y: rows - margin});
            }
        }
        for(let y = margin; y <= rows - margin; y++) {
            if (Math.abs(y - rows/2) > 4) {
                walls.push({x: margin, y}, {x: cols - margin, y});
            }
        }
    }
    
    return walls.filter(w => {
        const distFromCenter = Math.abs(w.x - cols/2) > 6 || Math.abs(w.y - rows/2) > 6;
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
