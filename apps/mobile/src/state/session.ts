import { create } from 'zustand';
import type { LanguageCode, SyncChanges } from '@cognigame/shared-types';

export type PlayedSession = {
  id: string;
  gameType: string;
  completedAt: number;
  accuracy: number;
};

export type LocalReminder = {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledTime: number;
};

type Session = {
  token: string | null;
  patientId: string | null;
  deviceId: string;
  language: LanguageCode;
  difficulty: 1 | 2 | 3 | 4 | 5;
  online: boolean;
  syncing: boolean;
  lastPulledAt: number | null;
  pendingChanges: SyncChanges;
  activity: PlayedSession[];
  reminders: LocalReminder[];
  setAuth: (token: string, patientId: string, difficulty?: 1 | 2 | 3 | 4 | 5) => void;
  setLanguage: (language: LanguageCode) => void;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastPulledAt: (n: number) => void;
  setPending: (c: SyncChanges) => void;
  clearPending: () => void;
  applyPull: (changes: SyncChanges) => void;
  rememberSession: (session: PlayedSession) => void;
  patchReminder: (id: string, status: string) => void;
};

export function kolkataDay(value: number) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(value));
}

export function playedToday(activity: PlayedSession[], gameType: string) {
  const today = kolkataDay(Date.now());
  return activity.some(
    (row) =>
      row.gameType === gameType &&
      kolkataDay(row.completedAt) === today,
  );
}

function asTime(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = new Date(String(value ?? '')).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function readSession(row: Record<string, unknown>): PlayedSession | null {
  const id = String(row.id ?? '');
  const gameType = String(row.gameType ?? row.game_type ?? '');
  if (!id || !gameType) return null;
  return {
    id,
    gameType,
    completedAt: asTime(row.completedAt ?? row.completed_at),
    accuracy: Number(row.accuracy ?? 0),
  };
}

function readReminder(row: Record<string, unknown>): LocalReminder | null {
  const id = String(row.id ?? '');
  if (!id) return null;
  return {
    id,
    title: String(row.title ?? ''),
    type: String(row.type ?? 'activity'),
    status: String(row.status ?? 'scheduled'),
    scheduledTime: asTime(row.scheduledTime ?? row.scheduled_time),
  };
}

function deviceId() {
  return 'device-local-' + Math.random().toString(36).slice(2, 10);
}

export const useSession = create<Session>((set) => ({
  token: null,
  patientId: null,
  deviceId: deviceId(),
  language: 'en',
  difficulty: 2,
  online: false,
  syncing: false,
  lastPulledAt: null,
  pendingChanges: {},
  activity: [],
  reminders: [],
  setAuth: (token, patientId, difficulty) =>
    set({ token, patientId, ...(difficulty ? { difficulty } : {}) }),
  setLanguage: (language) => set({ language }),
  setOnline: (online) => set({ online }),
  setSyncing: (syncing) => set({ syncing }),
  setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
  setPending: (pendingChanges) => set({ pendingChanges }),
  clearPending: () => set({ pendingChanges: {} }),
  rememberSession: (session) =>
    set((state) => ({
      activity: [session, ...state.activity.filter((row) => row.id !== session.id)],
    })),
  patchReminder: (id, status) =>
    set((state) => ({
      reminders: state.reminders.map((row) => (row.id === id ? { ...row, status } : row)),
    })),
  applyPull: (changes) =>
    set((state) => {
      const activity = [...state.activity];
      for (const row of [...(changes.game_sessions?.created ?? []), ...(changes.game_sessions?.updated ?? [])]) {
        const next = readSession(row as unknown as Record<string, unknown>);
        if (!next) continue;
        const index = activity.findIndex((item) => item.id === next.id);
        if (index >= 0) activity[index] = next;
        else activity.push(next);
      }
      const reminders = [...state.reminders];
      for (const row of [...(changes.reminders?.created ?? []), ...(changes.reminders?.updated ?? [])]) {
        const next = readReminder(row as unknown as Record<string, unknown>);
        if (!next) continue;
        const index = reminders.findIndex((item) => item.id === next.id);
        if (index >= 0) reminders[index] = next;
        else reminders.push(next);
      }
      return { activity, reminders };
    }),
}));
