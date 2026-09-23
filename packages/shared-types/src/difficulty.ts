import type { DifficultyLevel, GameType } from './enums';
import type { GameResult } from './game';

export interface DifficultyRecommendRequest {
  patientId: string;
  gameType: GameType;
  cognitiveBaselineScore: number;
  recentSessions: GameResult[];
}

export interface DifficultyRecommendResponse {
  recommendedDifficulty: DifficultyLevel;
  previousDifficulty: DifficultyLevel | null;
  reason: string;
  signals: {
    meanAccuracy: number | null;
    meanReactionTimeMs: number | null;
    completionRate: number | null;
    sampleSize: number;
  };
  model: 'rules-v1';
}
