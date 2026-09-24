import type { PullResponse, PushRequest, SyncChanges } from '@cognigame/shared-types';
import { useSession } from '../state/session';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function pullChanges(lastPulledAt: number | null): Promise<PullResponse> {
  const { token, patientId, deviceId } = useSession.getState();
  if (!token || !patientId) throw new Error('not paired');
  const res = await fetch(`${API}/sync/pull`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lastPulledAt, patientId, deviceId, schemaVersion: 1 }),
  });
  if (!res.ok) throw new Error(`pull failed ${res.status}`);
  return res.json();
}

export async function pushChanges(body: Omit<PushRequest, 'patientId' | 'deviceId'>): Promise<void> {
  const { token, patientId, deviceId } = useSession.getState();
  if (!token || !patientId) throw new Error('not paired');
  const res = await fetch(`${API}/sync/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...body, patientId: patientId as string, deviceId } satisfies PushRequest),
  });
  if (!res.ok) throw new Error(`push failed ${res.status}`);
}

export async function synchronizeIfOnline() {
  try {
    const last = useSession.getState().lastPulledAt;
    const pulled = await pullChanges(last);
    useSession.getState().applyPull(pulled.changes);
    useSession.getState().setLastPulledAt(pulled.timestamp);
    const pending = useSession.getState().pendingChanges;
    if (Object.keys(pending).length) {
      await pushChanges({ changes: pending, lastPulledAt: last });
      useSession.getState().clearPending();
    }
    useSession.getState().setOnline(true);
  } catch {
    useSession.getState().setOnline(false);
  }
}

export function queueChange(table: string, row: Record<string, unknown>, kind: 'created' | 'updated' | 'deleted') {
  const pending: SyncChanges = { ...useSession.getState().pendingChanges };
  const set = pending[table] ?? { created: [], updated: [], deleted: [] };
  if (kind === 'deleted') set.deleted.push(String(row.id));
  else if (kind === 'created') set.created.push(row as never);
  else set.updated.push(row as never);
  pending[table] = set;
  useSession.getState().setPending(pending);
}
