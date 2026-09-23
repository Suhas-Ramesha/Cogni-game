import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user';
import { AuthPrincipal } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(AuthGuard)
export class AlertsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthPrincipal) {
    return this.prisma.alert.findMany({
      where: user.caregiverId ? { caregiverId: user.caregiverId } : { patientId: user.patientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { patient: { select: { id: true, name: true } } },
    });
  }

  @Patch(':id/ack')
  ack(@Param('id') id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { acknowledgedAt: new Date() },
    });
  }

  @Get('scan/:patientId')
  scan(@Param('patientId') patientId: string) {
    return this.alerts.evaluateInactivity(patientId);
  }
}
