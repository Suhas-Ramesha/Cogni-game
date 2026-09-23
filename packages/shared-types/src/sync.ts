export type FieldClocks = Record<string, number>;

export interface Syncable {
  id: string;
  updatedAt: number;
  deletedAt?: number | null;
  fieldClocks: FieldClocks;
}

export interface TableChangeSet<T extends Syncable = Syncable> {
  created: T[];
  updated: T[];
  deleted: string[];
}

export type SyncChanges = Record<string, TableChangeSet>;

export interface PullRequest {
  lastPulledAt: number | null;
  patientId: string;
  deviceId: string;
  schemaVersion: number;
}

export interface PullResponse {
  changes: SyncChanges;
  timestamp: number;
}

export interface PushRequest {
  lastPulledAt: number | null;
  patientId: string;
  deviceId: string;
  changes: SyncChanges;
}

export interface PushConflict {
  table: string;
  id: string;
  fields: string[];
  resolution: 'server' | 'client' | 'merged';
}

export interface PushResponse {
  timestamp: number;
  conflictCount: number;
  conflicts: PushConflict[];
}

export const SYNC_TABLES = [
  'patients',
  'game_sessions',
  'reminders',
  'cognitive_metrics',
  'game_content_packs',
  'mood_check_ins',
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];
