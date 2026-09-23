import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiveGateway } from '../live/live.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => LiveGateway)) private readonly live?: LiveGateway,
  ) {}

  async missedReminder(patientId: string, title: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return;
    const alert = await this.prisma.alert.create({
      data: {
        patientId,
        caregiverId: patient.caregiverId,
        type: 'missed_reminder',
        severity: 'warning',
        message: `Missed reminder: ${title}`,
      },
    });
    this.live?.emitAlert(patient.caregiverId, alert);
    return alert;
  }

  async evaluatePerformance(patientId: string) {
    const recent = await this.prisma.gameSession.findMany({
      where: { patientId, deletedAt: null, gameType: { not: 'emotional_engagement' } },
      orderBy: { completedAt: 'desc' },
      take: 6,
    });
    if (recent.length < 4) return;
    const newest = recent.slice(0, 3);
    const older = recent.slice(3, 6);
    const avg = (rows: typeof recent) => rows.reduce((s, r) => s + r.score, 0) / rows.length;
    if (avg(newest) < avg(older) * 0.7) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return;
      const alert = await this.prisma.alert.create({
        data: {
          patientId,
          caregiverId: patient.caregiverId,
          type: 'performance_drop',
          severity: 'critical',
          message: 'Sudden drop in game scores over the last sessions',
        },
      });
      this.live?.emitAlert(patient.caregiverId, alert);
    }
  }

  async evaluateInactivity(patientId: string) {
    const last = await this.prisma.gameSession.findFirst({
      where: { patientId, deletedAt: null },
      orderBy: { completedAt: 'desc' },
    });
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    if (last && last.completedAt.getTime() < cutoff) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return;
      const existing = await this.prisma.alert.findFirst({
        where: {
          patientId,
          type: 'inactivity',
          createdAt: { gte: new Date(cutoff) },
        },
      });
      if (existing) return existing;
      const alert = await this.prisma.alert.create({
        data: {
          patientId,
          caregiverId: patient.caregiverId,
          type: 'inactivity',
          severity: 'warning',
          message: 'No play for more than 48 hours',
        },
      });
      this.live?.emitAlert(patient.caregiverId, alert);
      return alert;
    }
    return null;
  }
}
