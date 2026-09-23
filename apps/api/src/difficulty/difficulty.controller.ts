import { Controller, Param, Post, UseGuards, Inject } from '@nestjs/common';
import { GameType } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { DifficultyService } from './difficulty.service';

@Controller('difficulty')
@UseGuards(AuthGuard)
export class DifficultyController {
  constructor(@Inject(DifficultyService) private readonly difficulty: DifficultyService) {}

  @Post(':patientId/:gameType')
  recommend(@Param('patientId') patientId: string, @Param('gameType') gameType: GameType) {
    return this.difficulty.recommend(patientId, gameType);
  }
}
