import type {
  DifficultyLevel,
  GameModule,
  GameResult,
  GameRound,
  LanguageCode,
  PlayerInput,
  Timing,
} from '@cognigame/shared-types';
import { REGIONAL_ASSETS } from '../assets';
import { recommendedDifficulty, scoreFromAccuracy } from '../difficulty-hooks';
import { shuffle } from '../shuffle';

function pairCount(d: DifficultyLevel): number {
  return d === 1 ? 2 : d === 2 ? 3 : d === 3 ? 4 : d === 4 ? 5 : 6;
}

export const memoryMatch: GameModule = {
  type: 'memory_match',
  buildRound(difficulty, language) {
    const n = pairCount(difficulty);
    const tiles = shuffle(
      REGIONAL_ASSETS.slice(0, n).flatMap((a) => [
        { tileId: `${a.id}-a`, assetId: a.id, label: a.labels[language], emoji: a.emoji },
        { tileId: `${a.id}-b`, assetId: a.id, label: a.labels[language], emoji: a.emoji },
      ]),
    );
    return {
      id: `mm-${difficulty}-${n}`,
      gameType: 'memory_match',
      difficultyLevel: difficulty,
      language,
      promptKey: 'memoryMatch',
      narrationKey: 'memoryMatch',
      payload: { tiles, pairs: n },
    };
  },
  score(input, round, timing): GameResult {
    const expected = Number(round.payload.pairs);
    const matches = Number((input.raw as { matches?: number }).matches ?? 0);
    const accuracy = expected === 0 ? 0 : Math.min(1, matches / expected);
    const reactionTimeMs = timing.finishedAtMs - timing.startedAtMs;
    return {
      gameType: 'memory_match',
      difficultyLevel: round.difficultyLevel,
      score: scoreFromAccuracy(accuracy, reactionTimeMs, round.difficultyLevel),
      accuracy,
      reactionTimeMs,
      completedAt: new Date(timing.finishedAtMs).toISOString(),
      metadata: { matches, expected },
    };
  },
  recommendedDifficulty,
};

export function isMemoryMatch(language: LanguageCode, difficulty: DifficultyLevel): GameRound {
  return memoryMatch.buildRound(difficulty, language);
}
