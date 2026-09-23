import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameType } from '@prisma/client';
import type { DifficultyRecommendResponse, GameResult } from '@cognigame/shared-types';

@Injectable()
export class DifficultyService {
  private readonly log = new Logger(DifficultyService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recommend(patientId: string, gameType: GameType): Promise<DifficultyRecommendResponse | null> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return null;
    const recent = await this.prisma.gameSession.findMany({
      where: { patientId, gameType, deletedAt: null },
      orderBy: { completedAt: 'desc' },
      take: 8,
    });
    const payload = {
      patientId,
      gameType,
      cognitiveBaselineScore: patient.cognitiveBaselineScore,
      recentSessions: recent.reverse().map(
        (s): GameResult => ({
          gameType: s.gameType,
          difficultyLevel: s.difficultyLevel as 1 | 2 | 3 | 4 | 5,
          score: s.score,
          accuracy: s.accuracy,
          reactionTimeMs: s.reactionTimeMs,
          completedAt: s.completedAt.toISOString(),
        }),
      ),
    };
    const url = `${process.env.DIFFICULTY_SERVICE_URL ?? 'http://127.0.0.1:8001'}/v1/recommend`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-key': process.env.INTERNAL_SERVICE_KEY ?? 'dev-internal-key',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.log.warn(`difficulty service ${res.status}`);
        return null;
      }
      const body = (await res.json()) as DifficultyRecommendResponse;
      await this.prisma.difficultyRecommendation.create({
        data: {
          patientId,
          gameType,
          recommendedDifficulty: body.recommendedDifficulty,
          reason: body.reason,
          signals: body.signals as object,
        },
      });
      await this.prisma.patient.update({
        where: { id: patientId },
        data: { currentDifficulty: body.recommendedDifficulty },
      });
      return body;
    } catch (err) {
      this.log.warn(`difficulty service unreachable: ${(err as Error).message}`);
      return null;
    }
  }
}
