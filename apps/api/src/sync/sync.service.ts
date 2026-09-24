import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiveGateway } from '../live/live.gateway';
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
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(LiveGateway) private readonly live: LiveGateway,
  ) {}

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

  async push(
    patientId: string,
    deviceId: string,
    changes: SyncChanges,
    lastPulledAt: number | null,
    caregiverId?: string,
  ) {
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
    const owner =
      caregiverId ??
      (
        await this.prisma.patient.findUnique({
          where: { id: patientId },
          select: { caregiverId: true },
        })
      )?.caregiverId;
    if (owner) this.live.emitSync(owner, { patientId, deviceId, timestamp });
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
      const clean = this.sanitize(table, row, patientId);
      const id = String(clean.id ?? row.id);
      const existing = await client.findUnique({ where: { id } });
      if (!existing) {
        await client.upsert({
          where: { id },
          create: { ...clean, id },
          update: { ...clean, id },
        });
        return;
      }
      const merged = this.mergeFields(existing, { ...clean, id });
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
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[CAMEL[key] ?? key] = value;
    }
    for (const field of JSON_FIELDS) {
      if (typeof mapped[field] === 'string') {
        try {
          mapped[field] = JSON.parse(String(mapped[field]));
        } catch {
          mapped[field] = {};
        }
      }
    }
    for (const field of DATE_FIELDS) {
      const value = mapped[field];
      if (typeof value === 'number') mapped[field] = new Date(value);
      else if (typeof value === 'string' && value) mapped[field] = new Date(value);
    }
    for (const field of INT_FIELDS) {
      if (mapped[field] != null && mapped[field] !== '') mapped[field] = Math.round(Number(mapped[field]));
    }
    for (const field of FLOAT_FIELDS) {
      if (mapped[field] != null && mapped[field] !== '') mapped[field] = Number(mapped[field]);
    }
    if (table !== 'game_content_packs' && table !== 'patients') mapped.patientId = patientId;
    const allowed = ALLOWED[table];
    const out: Record<string, unknown> = {};
    for (const key of allowed) {
      if (mapped[key] !== undefined) out[key] = mapped[key];
    }
    return out;
  }
}

const CAMEL: Record<string, string> = {
  patient_id: 'patientId',
  game_type: 'gameType',
  difficulty_level: 'difficultyLevel',
  reaction_time_ms: 'reactionTimeMs',
  completed_at: 'completedAt',
  field_clocks: 'fieldClocks',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  scheduled_time: 'scheduledTime',
  recurrence_rule: 'recurrenceRule',
  local_notification_id: 'localNotificationId',
  recorded_at: 'recordedAt',
  metric_type: 'metricType',
  preferred_language: 'preferredLanguage',
  date_of_birth: 'dateOfBirth',
  deleted_at: 'deletedAt',
};

const DATE_FIELDS = ['completedAt', 'scheduledTime', 'recordedAt', 'dateOfBirth', 'updatedAt', 'createdAt', 'deletedAt'];
const JSON_FIELDS = ['fieldClocks', 'metadata'];
const INT_FIELDS = ['difficultyLevel', 'reactionTimeMs'];
const FLOAT_FIELDS = ['score', 'accuracy', 'value'];

const ALLOWED: Record<TableName, string[]> = {
  patients: ['id', 'name', 'preferredLanguage', 'fieldClocks'],
  game_sessions: [
    'id',
    'patientId',
    'gameType',
    'difficultyLevel',
    'score',
    'accuracy',
    'reactionTimeMs',
    'completedAt',
    'fieldClocks',
    'metadata',
  ],
  reminders: [
    'id',
    'patientId',
    'type',
    'title',
    'scheduledTime',
    'recurrenceRule',
    'status',
    'localNotificationId',
    'fieldClocks',
  ],
  cognitive_metrics: ['id', 'patientId', 'metricType', 'value', 'recordedAt', 'fieldClocks'],
  game_content_packs: ['id', 'language', 'theme', 'assetBundleVersion', 'offlineAvailable', 'fieldClocks'],
  mood_check_ins: ['id', 'patientId', 'mood', 'note', 'recordedAt', 'fieldClocks'],
};
