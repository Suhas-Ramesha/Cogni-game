import { Body, Controller, Get, Param, Post, UseGuards, Inject } from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { GameType } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { DifficultyService } from '../difficulty/difficulty.service';

class CreateSessionDto {
  @IsString()
  patientId: string;

  @IsString()
  gameType: GameType;

  @IsNumber()
  difficultyLevel: number;

  @IsNumber()
  score: number;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  reactionTimeMs: number;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AlertsService) private readonly alerts: AlertsService,
    @Inject(DifficultyService) private readonly difficulty: DifficultyService,
  ) {}

  @Get(':patientId')
  list(@Param('patientId') patientId: string) {
    return this.prisma.gameSession.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });
  }

  @Post()
  async create(@Body() body: CreateSessionDto) {
    const session = await this.prisma.gameSession.create({
      data: {
        patientId: body.patientId,
        gameType: body.gameType,
        difficultyLevel: body.difficultyLevel,
        score: body.score,
        accuracy: body.accuracy,
        reactionTimeMs: body.reactionTimeMs,
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        syncedAt: new Date(),
        metadata: (body.metadata ?? {}) as object,
      },
    });
    await this.prisma.cognitiveMetric.create({
      data: {
        patientId: body.patientId,
        metricType: `${body.gameType}.score`,
        value: body.score,
        recordedAt: session.completedAt,
      },
    });
    await this.alerts.evaluatePerformance(body.patientId);
    await this.difficulty.recommend(body.patientId, body.gameType).catch(() => undefined);
    return session;
  }
}
