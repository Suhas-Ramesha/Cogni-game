import { Module } from '@nestjs/common';
import { DifficultyService } from './difficulty.service';
import { DifficultyController } from './difficulty.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DifficultyService],
  controllers: [DifficultyController],
  exports: [DifficultyService],
})
export class DifficultyModule {}
