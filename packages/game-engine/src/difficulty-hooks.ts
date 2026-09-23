import type { DifficultyLevel, GameResult } from '@cognigame/shared-types';

const TARGET_RT: Record<DifficultyLevel, number> = {
  1: 8000,
  2: 6000,
  3: 4500,
  4: 3200,
  5: 2200,
};

export function clampDifficulty(n: number): DifficultyLevel {
  return Math.min(5, Math.max(1, Math.round(n))) as DifficultyLevel;
}

/** Offline fallback mirroring rules-v1 (FastAPI is source of truth when online). */
export function recommendedDifficulty(history: GameResult[]): DifficultyLevel {
  if (history.length === 0) return 2;
  const window = history.slice(-5);
  const last = window[window.length - 1];
  if (last.gameType === 'emotional_engagement') {
    return last.difficultyLevel;
  }
  const meanAcc = window.reduce((s, r) => s + r.accuracy, 0) / window.length;
  const meanRt = window.reduce((s, r) => s + r.reactionTimeMs, 0) / window.length;
  let next = last.difficultyLevel;
  if (meanAcc >= 0.85 && meanRt <= TARGET_RT[last.difficultyLevel] && window.length >= 3) {
    next += 1;
  } else if (meanAcc <= 0.45 && window.length >= 2) {
    next -= 1;
  }
  return clampDifficulty(next);
}

export function scoreFromAccuracy(accuracy: number, reactionTimeMs: number, difficulty: DifficultyLevel): number {
  const speedBonus = Math.max(0, 1 - reactionTimeMs / (TARGET_RT[difficulty] * 1.5));
  return Math.round(Math.min(100, Math.max(0, accuracy * 80 + speedBonus * 20)));
}
