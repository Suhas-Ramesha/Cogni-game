import { create } from 'zustand';
import type { LanguageCode, SyncChanges } from '@cognigame/shared-types';

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
  setAuth: (token: string, patientId: string, difficulty?: 1 | 2 | 3 | 4 | 5) => void;
  setLanguage: (language: LanguageCode) => void;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastPulledAt: (n: number) => void;
  setPending: (c: SyncChanges) => void;
  clearPending: () => void;
};

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
  setAuth: (token, patientId, difficulty) =>
    set({ token, patientId, ...(difficulty ? { difficulty } : {}) }),
  setLanguage: (language) => set({ language }),
  setOnline: (online) => set({ online }),
  setSyncing: (syncing) => set({ syncing }),
  setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
  setPending: (pendingChanges) => set({ pendingChanges }),
  clearPending: () => set({ pendingChanges: {} }),
}));
