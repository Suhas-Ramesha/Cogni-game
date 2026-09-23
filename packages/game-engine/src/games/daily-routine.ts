import type { GameModule, GameResult } from '@cognigame/shared-types';
import { ROUTINE_STEPS } from '../assets';
import { recommendedDifficulty, scoreFromAccuracy } from '../difficulty-hooks';
import { shuffle } from '../shuffle';

export const dailyRoutine: GameModule = {
  type: 'daily_routine',
  buildRound(difficulty, language) {
    const take = difficulty <= 2 ? 3 : difficulty === 3 ? 4 : difficulty === 4 ? 5 : 7;
    const steps = ROUTINE_STEPS.slice(0, take).map((s) => ({
      id: s.id,
      order: s.order,
      label: s.labels[language],
      asset: s.asset,
    }));
    const shuffled = shuffle(steps);
    return {
      id: `dr-${difficulty}`,
      gameType: 'daily_routine',
      difficultyLevel: difficulty,
      language,
      promptKey: 'dailyRoutine',
      narrationKey: 'dailyRoutine',
      payload: { steps: shuffled, correctOrder: steps.map((s) => s.id) },
    };
  },
  score(input, round, timing): GameResult {
    const order = (input.raw as { order?: string[] }).order ?? [];
    const correct = (round.payload.correctOrder as string[]) ?? [];
    let hits = 0;
    for (let i = 0; i < correct.length; i += 1) {
      if (order[i] === correct[i]) hits += 1;
    }
    const accuracy = correct.length === 0 ? 0 : hits / correct.length;
    const reactionTimeMs = timing.finishedAtMs - timing.startedAtMs;
    return {
      gameType: 'daily_routine',
      difficultyLevel: round.difficultyLevel,
      score: scoreFromAccuracy(accuracy, reactionTimeMs, round.difficultyLevel),
      accuracy,
      reactionTimeMs,
      completedAt: new Date(timing.finishedAtMs).toISOString(),
      metadata: { order, correct },
    };
  },
  recommendedDifficulty,
};
