import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { SyncModule } from './sync/sync.module';
import { RemindersModule } from './reminders/reminders.module';
import { SessionsModule } from './sessions/sessions.module';
import { AlertsModule } from './alerts/alerts.module';
import { DifficultyModule } from './difficulty/difficulty.module';
import { LiveModule } from './live/live.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientsModule,
    SyncModule,
    RemindersModule,
    SessionsModule,
    AlertsModule,
    DifficultyModule,
    LiveModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
