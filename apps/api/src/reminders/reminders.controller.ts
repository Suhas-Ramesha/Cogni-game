import { Body, Controller, Get, Param, Patch, Post, UseGuards, Inject } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ReminderStatus, ReminderType } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';

class CreateReminderDto {
  @IsString()
  patientId: string;

  @IsString()
  type: ReminderType;

  @IsString()
  title: string;

  @IsString()
  scheduledTime: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}

class PatchReminderDto {
  @IsOptional()
  @IsString()
  status?: ReminderStatus;

  @IsOptional()
  @IsString()
  localNotificationId?: string;
}

@Controller('reminders')
@UseGuards(AuthGuard)
export class RemindersController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AlertsService) private readonly alerts: AlertsService,
  ) {}

  @Get(':patientId')
  list(@Param('patientId') patientId: string) {
    return this.prisma.reminder.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  @Post()
  create(@Body() body: CreateReminderDto) {
    return this.prisma.reminder.create({
      data: {
        patientId: body.patientId,
        type: body.type,
        title: body.title,
        scheduledTime: new Date(body.scheduledTime),
        recurrenceRule: body.recurrenceRule,
      },
    });
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: PatchReminderDto) {
    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        status: body.status,
        localNotificationId: body.localNotificationId,
        fieldClocks: { status: Date.now() },
      },
    });
    if (body.status === 'missed') {
      await this.alerts.missedReminder(reminder.patientId, reminder.title);
    }
    return reminder;
  }
}
