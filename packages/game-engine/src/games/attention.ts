import type { DifficultyLevel, GameModule, GameResult } from '@cognigame/shared-types';
import { REGIONAL_ASSETS } from '../assets';
import { recommendedDifficulty, scoreFromAccuracy } from '../difficulty-hooks';
import { shuffle } from '../shuffle';

function optionCount(d: DifficultyLevel): number {
  return d <= 2 ? 3 : d === 3 ? 4 : 5;
}

export const attention: GameModule = {
  type: 'attention',
  buildRound(difficulty, language) {
    const count = optionCount(difficulty);
    const pool = REGIONAL_ASSETS.slice(0, count);
    const odd = pool[pool.length - 1];
    const common = pool[0];
    const options = shuffle(
      Array.from({ length: count }, (_, i) => {
        const item = i === count - 1 ? odd : common;
        return {
          id: `${item.id}-${i}`,
          assetId: item.id,
          label: item.labels[language],
          emoji: item.emoji,
          odd: i === count - 1,
        };
      }),
    );
    const correct = options.find((o) => o.odd);
    return {
      id: `att-${difficulty}`,
      gameType: 'attention',
      difficultyLevel: difficulty,
      language,
      promptKey: 'attention',
      narrationKey: 'attention',
      payload: { options, correctId: correct?.id },
    };
  },
  score(input, round, timing): GameResult {
    const chosen = String((input.raw as { chosenId?: string }).chosenId ?? '');
    const correct = chosen === String(round.payload.correctId);
    const accuracy = correct ? 1 : 0;
    const reactionTimeMs = timing.finishedAtMs - timing.startedAtMs;
    return {
      gameType: 'attention',
      difficultyLevel: round.difficultyLevel,
      score: scoreFromAccuracy(accuracy, reactionTimeMs, round.difficultyLevel),
      accuracy,
      reactionTimeMs,
      completedAt: new Date(timing.finishedAtMs).toISOString(),
      metadata: { chosen, correctId: round.payload.correctId },
    };
  },
  recommendedDifficulty,
};
