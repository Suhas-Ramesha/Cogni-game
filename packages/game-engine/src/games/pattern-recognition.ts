import type { GameModule, GameResult } from '@cognigame/shared-types';
import { SHAPES } from '../assets';
import { recommendedDifficulty, scoreFromAccuracy } from '../difficulty-hooks';
import { shuffle } from '../shuffle';

export const patternRecognition: GameModule = {
  type: 'pattern_recognition',
  buildRound(difficulty, language) {
    const n = difficulty <= 2 ? 3 : difficulty === 3 ? 4 : 5;
    const target = SHAPES[difficulty % SHAPES.length];
    const options = shuffle(
      SHAPES.slice(0, n).map((s) => ({
        id: s.id,
        color: s.color,
        isTarget: s.id === target.id,
      })),
    );
    return {
      id: `pr-${difficulty}`,
      gameType: 'pattern_recognition',
      difficultyLevel: difficulty,
      language,
      promptKey: 'pattern',
      narrationKey: 'pattern',
      payload: { targetId: target.id, targetColor: target.color, options },
    };
  },
  score(input, round, timing): GameResult {
    const chosen = String((input.raw as { chosenId?: string }).chosenId ?? '');
    const accuracy = chosen === String(round.payload.targetId) ? 1 : 0;
    const reactionTimeMs = timing.finishedAtMs - timing.startedAtMs;
    return {
      gameType: 'pattern_recognition',
      difficultyLevel: round.difficultyLevel,
      score: scoreFromAccuracy(accuracy, reactionTimeMs, round.difficultyLevel),
      accuracy,
      reactionTimeMs,
      completedAt: new Date(timing.finishedAtMs).toISOString(),
      metadata: { chosen, targetId: round.payload.targetId },
    };
  },
  recommendedDifficulty,
};
