import { describe, expect, it } from 'vitest';
import { getGame, recommendedDifficulty, scoreFromAccuracy } from '../src';
import type { GameResult } from '@cognigame/shared-types';

const timing = { startedAtMs: 1_000, finishedAtMs: 3_000 };

describe('memory match', () => {
  it('scores perfect matches at full accuracy', () => {
    const game = getGame('memory_match');
    const round = game.buildRound(2, 'as');
    const pairs = Number(round.payload.pairs);
    const result = game.score({ raw: { matches: pairs } }, round, timing);
    expect(result.accuracy).toBe(1);
    expect(result.gameType).toBe('memory_match');
    expect(result.score).toBeGreaterThan(70);
  });
});

describe('attention', () => {
  it('is binary correct/incorrect', () => {
    const game = getGame('attention');
    const round = game.buildRound(3, 'en');
    const ok = game.score({ raw: { chosenId: round.payload.correctId } }, round, timing);
    const bad = game.score({ raw: { chosenId: 'nope' } }, round, timing);
    expect(ok.accuracy).toBe(1);
    expect(bad.accuracy).toBe(0);
  });
});

describe('daily routine', () => {
  it('uses positional accuracy', () => {
    const game = getGame('daily_routine');
    const round = game.buildRound(1, 'kha');
    const correct = round.payload.correctOrder as string[];
    const half = [...correct];
    half[0] = correct[1] ?? correct[0];
    const result = game.score({ raw: { order: half } }, round, timing);
    expect(result.accuracy).toBeGreaterThan(0);
    expect(result.accuracy).toBeLessThan(1);
  });
});

describe('pattern recognition', () => {
  it('matches target shape', () => {
    const game = getGame('pattern_recognition');
    const round = game.buildRound(4, 'en');
    const result = game.score({ raw: { chosenId: round.payload.targetId } }, round, timing);
    expect(result.accuracy).toBe(1);
  });
});

describe('emotional engagement', () => {
  it('never treats mood as a win/lose game', () => {
    const game = getGame('emotional_engagement');
    const round = game.buildRound(5, 'as');
    const result = game.score({ raw: { mood: 'sad' } }, round, timing);
    expect(result.accuracy).toBe(1);
    expect(result.difficultyLevel).toBe(1);
    expect(result.metadata?.notCompetitive).toBe(true);
  });
});

describe('difficulty hooks', () => {
  it('raises difficulty after strong streak', () => {
    const history: GameResult[] = Array.from({ length: 5 }, () => ({
      gameType: 'memory_match',
      difficultyLevel: 2,
      score: 90,
      accuracy: 0.95,
      reactionTimeMs: 2000,
      completedAt: new Date().toISOString(),
    }));
    expect(recommendedDifficulty(history)).toBe(3);
  });

  it('lowers difficulty after misses', () => {
    const history: GameResult[] = Array.from({ length: 3 }, () => ({
      gameType: 'attention',
      difficultyLevel: 3,
      score: 20,
      accuracy: 0.2,
      reactionTimeMs: 9000,
      completedAt: new Date().toISOString(),
    }));
    expect(recommendedDifficulty(history)).toBe(2);
  });

  it('clamps score into 0-100', () => {
    expect(scoreFromAccuracy(1, 100, 1)).toBeGreaterThan(80);
    expect(scoreFromAccuracy(0, 90_000, 5)).toBe(0);
  });
});
