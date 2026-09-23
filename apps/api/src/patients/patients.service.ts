import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthPrincipal } from '../auth/auth.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFor(user: AuthPrincipal) {
    if (user.role !== 'caregiver' || !user.caregiverId) {
      throw new ForbiddenException('Caregivers only');
    }
    const patients = await this.prisma.patient.findMany({
      where: { caregiverId: user.caregiverId, deletedAt: null },
      include: {
        devices: true,
        alerts: { where: { acknowledgedAt: null }, orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { name: 'asc' },
    });
    return patients.map((p) => ({
      ...p,
      lastSyncedAt: p.devices.map((d) => d.lastSyncedAt).sort().at(-1) ?? null,
      lastSeenAt: p.devices.map((d) => d.lastSeenAt).sort().at(-1) ?? null,
      openAlertCount: p.alerts.length,
    }));
  }

  async detail(id: string, user: AuthPrincipal) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { caregiver: true, devices: true },
    });
    if (!patient || patient.deletedAt) throw new NotFoundException('Patient not found');
    this.assertAccess(patient, user);

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [sessions, metrics, reminders, alerts, moods] = await Promise.all([
      this.prisma.gameSession.findMany({
        where: { patientId: id, deletedAt: null, completedAt: { gte: since } },
        orderBy: { completedAt: 'asc' },
      }),
      this.prisma.cognitiveMetric.findMany({
        where: { patientId: id, deletedAt: null, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
      }),
      this.prisma.reminder.findMany({
        where: { patientId: id, deletedAt: null },
        orderBy: { scheduledTime: 'desc' },
        take: 40,
      }),
      this.prisma.alert.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.moodCheckIn.findMany({
        where: { patientId: id, deletedAt: null, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
      }),
    ]);

    const heatmapMap = new Map<string, number>();
    for (const s of sessions) {
      const day = s.completedAt.toISOString().slice(0, 10);
      heatmapMap.set(day, (heatmapMap.get(day) ?? 0) + 1);
    }
    const heatmap = [...heatmapMap.entries()].map(([date, count]) => ({ date, count }));

    const completed = reminders.filter((r) => r.status === 'completed').length;
    const missed = reminders.filter((r) => r.status === 'missed').length;
    const scheduled = reminders.filter((r) => r.status === 'scheduled' || r.status === 'due').length;

    return {
      patient: {
        ...patient,
        lastSyncedAt: patient.devices.map((d) => d.lastSyncedAt).sort().at(-1) ?? null,
        lastSeenAt: patient.devices.map((d) => d.lastSeenAt).sort().at(-1) ?? null,
      },
      caregiver: patient.caregiver,
      sessions,
      metrics,
      reminders,
      alerts,
      moods,
      heatmap,
      compliance: { completed, missed, scheduled },
    };
  }

  async pair(pairingCode: string, deviceId: string, platform: string) {
    const patient = await this.prisma.patient.findUnique({ where: { pairingCode } });
    if (!patient) throw new NotFoundException('Unknown pairing code');
    await this.prisma.device.upsert({
      where: { id: deviceId },
      create: { id: deviceId, patientId: patient.id, platform, lastSeenAt: new Date() },
      update: { lastSeenAt: new Date(), platform },
    });
    return patient;
  }

  assertAccess(patient: { id: string; caregiverId: string }, user: AuthPrincipal) {
    if (user.role === 'caregiver' && user.caregiverId === patient.caregiverId) return;
    if (user.role === 'patient' && user.patientId === patient.id) return;
    throw new ForbiddenException('Not allowed for this patient');
  }
}
