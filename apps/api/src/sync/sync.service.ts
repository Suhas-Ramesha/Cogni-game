import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PushConflict, SyncChanges, TableChangeSet } from '@cognigame/shared-types';

type Clocked = { fieldClocks?: Record<string, number> };

const TABLE_MODELS = {
  patients: 'patient',
  game_sessions: 'gameSession',
  reminders: 'reminder',
  cognitive_metrics: 'cognitiveMetric',
  game_content_packs: 'gameContentPack',
  mood_check_ins: 'moodCheckIn',
} as const;

type TableName = keyof typeof TABLE_MODELS;

@Injectable()
export class SyncService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async pull(patientId: string, lastPulledAt: number | null, deviceId: string) {
    const since = lastPulledAt ? new Date(lastPulledAt) : new Date(0);
    const timestamp = Date.now();

    const [patients, sessions, reminders, metrics, packs, moods] = await Promise.all([
      this.changed('patient', { id: patientId }, since),
      this.changed('gameSession', { patientId }, since),
      this.changed('reminder', { patientId }, since),
      this.changed('cognitiveMetric', { patientId }, since),
      this.changed('gameContentPack', {}, since),
      this.changed('moodCheckIn', { patientId }, since),
    ]);

    await this.prisma.device.upsert({
      where: { id: deviceId },
      create: { id: deviceId, patientId, lastSyncedAt: new Date(timestamp), lastSeenAt: new Date() },
      update: { lastSyncedAt: new Date(timestamp), lastSeenAt: new Date() },
    });
    await this.prisma.syncLog.create({
      data: { deviceId, patientId, lastPulledAt: new Date(timestamp), conflictCount: 0 },
    });

    return {
      timestamp,
      changes: {
        patients,
        game_sessions: sessions,
        reminders,
        cognitive_metrics: metrics,
        game_content_packs: packs,
        mood_check_ins: moods,
      },
    };
  }

  async push(patientId: string, deviceId: string, changes: SyncChanges, lastPulledAt: number | null) {
    const conflicts: PushConflict[] = [];
    for (const table of Object.keys(TABLE_MODELS) as TableName[]) {
      const set = changes[table];
      if (!set) continue;
      const more = await this.applyTable(table, set, patientId);
      conflicts.push(...more);
    }
    const timestamp = Date.now();
    await this.prisma.device.upsert({
      where: { id: deviceId },
      create: {
        id: deviceId,
        patientId,
        lastSyncedAt: new Date(timestamp),
        lastSeenAt: new Date(),
      },
      update: { lastSyncedAt: new Date(timestamp), lastSeenAt: new Date() },
    });
    await this.prisma.syncLog.create({
      data: {
        deviceId,
        patientId,
        lastPushedAt: new Date(timestamp),
        lastPulledAt: lastPulledAt ? new Date(lastPulledAt) : undefined,
        conflictCount: conflicts.length,
      },
    });
    return { timestamp, conflictCount: conflicts.length, conflicts };
  }

  private async changed(model: string, where: Record<string, string>, since: Date) {
    const client = (this.prisma as unknown as Record<string, { findMany: Function }>)[model];
    const rows = await client.findMany({
      where: { ...where, OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }] },
    });
    const created: unknown[] = [];
    const updated: unknown[] = [];
    const deleted: string[] = [];
    for (const row of rows as Array<{ id: string; createdAt: Date; deletedAt: Date | null }>) {
      if (row.deletedAt) deleted.push(row.id);
      else if (row.createdAt > since) created.push(row);
      else updated.push(row);
    }
    return { created, updated, deleted };
  }

  private async applyTable(table: TableName, set: TableChangeSet, patientId: string): Promise<PushConflict[]> {
    const model = TABLE_MODELS[table];
    const client = (this.prisma as unknown as Record<string, { findUnique: Function; upsert: Function; update: Function }>)[model];
    const conflicts: PushConflict[] = [];
    const applyRow = async (row: Record<string, unknown>, kind: 'created' | 'updated') => {
      const id = String(row.id);
      const existing = await client.findUnique({ where: { id } });
      if (!existing) {
        await client.upsert({
          where: { id },
          create: this.sanitize(table, row, patientId),
          update: this.sanitize(table, row, patientId),
        });
        return;
      }
      const merged = this.mergeFields(existing, row);
      if (merged.conflicted.length) {
        conflicts.push({
          table,
          id,
          fields: merged.conflicted,
          resolution: 'merged',
        });
      }
      await client.update({ where: { id }, data: merged.data });
      void kind;
    };
    for (const row of set.created ?? []) await applyRow(row as unknown as Record<string, unknown>, 'created');
    for (const row of set.updated ?? []) await applyRow(row as unknown as Record<string, unknown>, 'updated');
    for (const id of set.deleted ?? []) {
      await client.update({ where: { id }, data: { deletedAt: new Date() } }).catch(() => undefined);
    }
    return conflicts;
  }

  /**
   * Field-level last-write-wins using `fieldClocks`.
   * TODO: smarter per-entity resolution (reminder state machine) — see EXTENSION_POINTS.md
   */
  mergeFields(server: Clocked & Record<string, unknown>, incoming: Clocked & Record<string, unknown>) {
    const serverClocks = (server.fieldClocks ?? {}) as Record<string, number>;
    const clientClocks = (incoming.fieldClocks ?? {}) as Record<string, number>;
    const data: Record<string, unknown> = {};
    const conflicted: string[] = [];
    const skip = new Set(['id', 'createdAt', 'patientId']);
    for (const key of Object.keys(incoming)) {
      if (skip.has(key)) continue;
      const c = clientClocks[key] ?? incoming.updatedAt ?? 0;
      const s = serverClocks[key] ?? 0;
      if (Number(c) >= Number(s)) {
        data[key] = incoming[key];
        if (Number(s) > 0 && Number(c) !== Number(s) && server[key] !== incoming[key]) {
          conflicted.push(key);
        }
      }
    }
    data.fieldClocks = { ...serverClocks, ...clientClocks };
    data.updatedAt = new Date();
    return { data, conflicted };
  }

  private sanitize(table: TableName, row: Record<string, unknown>, patientId: string) {
    const copy = { ...row };
    if (table !== 'game_content_packs' && table !== 'patients') copy.patientId = patientId;
    if (copy.completedAt) copy.completedAt = new Date(String(copy.completedAt));
    if (copy.scheduledTime) copy.scheduledTime = new Date(String(copy.scheduledTime));
    if (copy.recordedAt) copy.recordedAt = new Date(String(copy.recordedAt));
    if (copy.dateOfBirth) copy.dateOfBirth = new Date(String(copy.dateOfBirth));
    if (copy.updatedAt) copy.updatedAt = new Date(String(copy.updatedAt));
    if (copy.createdAt) copy.createdAt = new Date(String(copy.createdAt));
    return copy;
  }
}
