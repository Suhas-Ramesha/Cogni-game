'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shell } from '../components/Shell';

type AlertRow = {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
  patient: { id: string; name: string };
};

export default function AlertsPage() {
  const [rows, setRows] = useState<AlertRow[]>([]);

  async function load() {
    setRows(await api<AlertRow[]>('/alerts'));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <Shell title="Alerts">
      <ul className="space-y-3">
        {rows.map((a) => (
          <li key={a.id} className="rounded-2xl bg-white p-4 border border-bark/10 flex justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-bark">
                {a.patient.name} · {a.type} · {a.severity}
              </p>
              <p className="mt-1">{a.message}</p>
              <p className="text-sm text-bark">{new Date(a.createdAt).toLocaleString('en-IN')}</p>
            </div>
            {!a.acknowledgedAt ? (
              <button
                className="min-h-tap px-4 rounded-xl bg-forest text-cream"
                onClick={async () => {
                  await api(`/alerts/${a.id}/ack`, { method: 'PATCH' });
                  await load();
                }}
              >
                Acknowledge
              </button>
            ) : (
              <span className="text-canopy self-center">Acknowledged</span>
            )}
          </li>
        ))}
      </ul>
    </Shell>
  );
}
