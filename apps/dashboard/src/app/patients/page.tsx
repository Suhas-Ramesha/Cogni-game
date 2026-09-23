'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shell } from '../components/Shell';

type Row = {
  id: string;
  name: string;
  preferredLanguage: string;
  pairingCode: string;
  lastSyncedAt: string | null;
  lastSeenAt: string | null;
  openAlertCount: number;
  currentDifficulty: number;
};

export default function PatientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Row[]>('/patients')
      .then(setRows)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <Shell title="Your patients">
      {error ? (
        <p className="text-alert">
          {error}. Start the API (`pnpm dev:api`) and seed data, then refresh.
        </p>
      ) : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              href={`/patients/${p.id}`}
              className="block rounded-3xl bg-white p-6 shadow-sm border border-bark/10 hover:border-canopy"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display text-2xl">{p.name}</h2>
                  <p className="text-bark mt-1">
                    Language {p.preferredLanguage.toUpperCase()} · pairing {p.pairingCode}
                  </p>
                </div>
                {p.openAlertCount > 0 ? (
                  <span className="bg-alert text-white text-sm px-3 py-1 rounded-full">
                    {p.openAlertCount} alert{p.openAlertCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="bg-mist text-canopy text-sm px-3 py-1 rounded-full">Stable</span>
                )}
              </div>
              <p className="mt-4 text-sm">
                Last synced:{' '}
                {p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleString('en-IN') : 'never'}
              </p>
              <p className="text-sm text-bark">Difficulty {p.currentDifficulty}/5</p>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
