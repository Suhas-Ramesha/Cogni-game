import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { GameType } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { DifficultyService } from './difficulty.service';

@Controller('difficulty')
@UseGuards(AuthGuard)
export class DifficultyController {
  constructor(private readonly difficulty: DifficultyService) {}

  @Post(':patientId/:gameType')
  recommend(@Param('patientId') patientId: string, @Param('gameType') gameType: GameType) {
    return this.difficulty.recommend(patientId, gameType);
  }
}
