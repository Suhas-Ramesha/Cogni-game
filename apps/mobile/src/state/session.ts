import { create } from 'zustand';
import type { LanguageCode, SyncChanges } from '@cognigame/shared-types';

type Session = {
  token: string | null;
  patientId: string | null;
  deviceId: string;
  language: LanguageCode;
  online: boolean;
  lastPulledAt: number | null;
  pendingChanges: SyncChanges;
  setAuth: (token: string, patientId: string) => void;
  setLanguage: (language: LanguageCode) => void;
  setOnline: (online: boolean) => void;
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
  language: 'as',
  online: false,
  lastPulledAt: null,
  pendingChanges: {},
  setAuth: (token, patientId) => set({ token, patientId }),
  setLanguage: (language) => set({ language }),
  setOnline: (online) => set({ online }),
  setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
  setPending: (pendingChanges) => set({ pendingChanges }),
  clearPending: () => set({ pendingChanges: {} }),
}));
