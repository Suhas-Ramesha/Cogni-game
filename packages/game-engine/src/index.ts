import type { GameModule, GameType } from '@cognigame/shared-types';
import { memoryMatch } from './games/memory-match';
import { attention } from './games/attention';
import { dailyRoutine } from './games/daily-routine';
import { patternRecognition } from './games/pattern-recognition';
import { emotionalEngagement } from './games/emotional-engagement';

export const GAME_MODULES: Record<GameType, GameModule> = {
  memory_match: memoryMatch,
  attention,
  daily_routine: dailyRoutine,
  pattern_recognition: patternRecognition,
  emotional_engagement: emotionalEngagement,
};

export function getGame(type: GameType): GameModule {
  return GAME_MODULES[type];
}

export * from './assets';
export * from './difficulty-hooks';
export { memoryMatch, attention, dailyRoutine, patternRecognition, emotionalEngagement };
