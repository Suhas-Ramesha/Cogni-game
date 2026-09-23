import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { AuthModule } from '../auth/auth.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuthModule, AlertsModule],
  controllers: [RemindersController],
})
export class RemindersModule {}
