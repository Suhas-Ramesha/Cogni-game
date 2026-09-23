import type { GameModule, GameResult, Mood } from '@cognigame/shared-types';
import { MOOD_CHOICES } from '../assets';
import { recommendedDifficulty } from '../difficulty-hooks';

const MOOD_SCORE: Record<string, number> = {
  joyful: 90,
  calm: 80,
  okay: 60,
  sad: 35,
  anxious: 30,
};

export const emotionalEngagement: GameModule = {
  type: 'emotional_engagement',
  buildRound(difficulty, language) {
    const choices = MOOD_CHOICES.map((m) => ({
      id: m.id,
      emoji: m.emoji,
      label: m.labels[language],
    }));
    return {
      id: `mood-${difficulty}`,
      gameType: 'emotional_engagement',
      difficultyLevel: 1,
      language,
      promptKey: 'howDoYouFeel',
      narrationKey: 'howDoYouFeel',
      payload: { choices },
    };
  },
  score(input, round, timing): GameResult {
    const mood = String((input.raw as { mood?: Mood }).mood ?? 'okay');
    const score = MOOD_SCORE[mood] ?? 60;
    return {
      gameType: 'emotional_engagement',
      difficultyLevel: 1,
      score,
      accuracy: 1,
      reactionTimeMs: timing.finishedAtMs - timing.startedAtMs,
      completedAt: new Date(timing.finishedAtMs).toISOString(),
      metadata: { mood, notCompetitive: true },
    };
  },
  recommendedDifficulty: (history) => recommendedDifficulty(history),
};
