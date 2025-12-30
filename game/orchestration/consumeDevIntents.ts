
import { DevIntent } from '../intents/DevIntents';
import { useGameState } from '../useGameState';
import { useSpawner } from '../useSpawner';
import { useProgression } from '../useProgression';
import { useStageController } from '../useStageController';
import { generateWalls } from '../gameUtils';
import { CameraBehavior } from '../camera/types';
import { COSMETIC_REGISTRY } from '../cosmetics/CosmeticRegistry';
import { DEV_START_CONFIG } from '../dev/DevStartConfig';
import { CHARACTERS, MUSIC_STAGE_MAP } from '../../constants';
import { applyDevStartOverrides } from './applyDevStartOverrides';
import { GameStatus } from '../../types';
import { audio } from '../../utils/audio';

export function consumeDevIntents(
  game: ReturnType<typeof useGameState>,
  spawner: ReturnType<typeof useSpawner>,
  progression: ReturnType<typeof useProgression>,
  stageController: ReturnType<typeof useStageController>
) {
  const { devIntentQueueRef, enemiesRef, foodRef, terminalsRef, scoreRef, setUiScore, stageRef, devModeFlagsRef, cameraRef, unlockedCosmetics, unlockCosmetic } = game;
  const queue = devIntentQueueRef.current;

  // Process all pending intents
  while (queue.length > 0) {
    const intent = queue.shift();
    if (!intent) break;

    switch (intent.type) {
      case 'RESET_GAME': {
        // 1. Determine Character
        let charProfile = CHARACTERS[0];
        if (DEV_START_CONFIG.enabled && DEV_START_CONFIG.characterId) {
             const found = CHARACTERS.find(c => c.id === DEV_START_CONFIG.characterId);
             if (found) charProfile = found;
        }

        // 2. Hard Reset
        game.resetGame(charProfile);
        
        // 3. Apply Overrides
        applyDevStartOverrides(game);
        
        // 4. Force Start
        spawner.spawnFood(); // Initial food
        game.setStatus(GameStatus.PLAYING);
        game.setUiStageStatus('DEV_OVERRIDE');
        
        // 5. Audio Sync
        const currentStage = game.stageRef.current;
        const isBoss = currentStage % 5 === 0;
        const mapKey = isBoss ? 0 : ((currentStage - 1) % 4) + 1;
        const layers = MUSIC_STAGE_MAP[mapKey] || MUSIC_STAGE_MAP[1];
        audio.setLayers(layers);
        audio.setMode('GAME');
        audio.startMusic();
        
        break;
      }

      case 'DEV_FORCE_STAGE':
        stageRef.current = intent.stageId;
        stageController.resetForNewStage(intent.stageId);
        break;

      case 'DEV_SPAWN_ENEMY':
        spawner.spawnEnemy(intent.enemyType, intent.pos);
        break;

      case 'DEV_SPAWN_TERMINAL':
        spawner.spawnTerminal(intent.pos, intent.terminalType === 'OVERRIDE' ? 'BOSS_OVERRIDE' : undefined);
        break;

      case 'DEV_REMOVE_ENTITY':
        const enemyIdx = enemiesRef.current.findIndex(e => e.id === intent.entityId);
        if (enemyIdx !== -1) {
            enemiesRef.current[enemyIdx].shouldRemove = true;
        }
        break;

      case 'DEV_GIVE_XP':
        progression.addXp(intent.amount);
        break;

      case 'DEV_GIVE_SCORE':
        scoreRef.current += intent.amount;
        setUiScore(scoreRef.current);
        break;

      case 'DEV_CLEAR_ENEMIES':
        enemiesRef.current.forEach(e => e.shouldRemove = true);
        break;

      case 'DEV_CLEAR_FOOD':
        foodRef.current.forEach(f => f.shouldRemove = true);
        break;

      case 'DEV_SET_CAMERA_MODE':
        game.requestCameraSwitch(intent.mode, 500);
        break;

      case 'DEV_SET_ZOOM':
        cameraRef.current.zoom = intent.zoom;
        cameraRef.current.behavior = CameraBehavior.MANUAL; // Lock to manual to prevent override
        break;

      case 'DEV_UNLOCK_ALL_COSMETICS':
          Object.keys(COSMETIC_REGISTRY).forEach(id => {
              if (!unlockedCosmetics.has(id)) {
                  unlockCosmetic(id);
              }
          });
          break;

      case 'DEV_TOGGLE_GOD_MODE':
          devModeFlagsRef.current.godMode = !devModeFlagsRef.current.godMode;
          // Note: God mode logic needs to be checked in useCollisions
          break;

      case 'DEV_SET_SCROLL_SPEED':
          cameraRef.current.scrollSpeed = intent.speed;
          break;
    }
  }
}
