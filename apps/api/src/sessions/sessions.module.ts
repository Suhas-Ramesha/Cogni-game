import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { AlertsModule } from '../alerts/alerts.module';
import { DifficultyModule } from '../difficulty/difficulty.module';

@Module({
  imports: [AuthModule, AlertsModule, DifficultyModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
