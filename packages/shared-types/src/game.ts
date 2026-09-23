import type { DifficultyLevel, GameType, LanguageCode } from './enums';

/** Canonical result consumed by the difficulty service and caregiver dashboard. */
export interface GameResult {
  gameType: GameType;
  difficultyLevel: DifficultyLevel;
  score: number;
  accuracy: number;
  reactionTimeMs: number;
  completedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GameRound {
  id: string;
  gameType: GameType;
  difficultyLevel: DifficultyLevel;
  language: LanguageCode;
  promptKey: string;
  narrationKey: string;
  payload: Record<string, unknown>;
}

export interface Timing {
  startedAtMs: number;
  finishedAtMs: number;
}

export interface PlayerInput {
  raw: unknown;
  correct?: boolean;
}

export interface GameModule {
  type: GameType;
  buildRound(difficulty: DifficultyLevel, language: LanguageCode): GameRound;
  score(input: PlayerInput, round: GameRound, timing: Timing): GameResult;
  /** Offline fallback; FastAPI is authoritative when the device is online. */
  recommendedDifficulty(history: GameResult[]): DifficultyLevel;
}
