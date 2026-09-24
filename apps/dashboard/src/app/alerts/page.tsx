'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatWhen } from '@/lib/format';
import { Shell } from '@/components/Shell';
import { EmptyState, StatusPill } from '@/components/ui';

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
  const [rows, setRows] = useState<AlertRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [acking, setAcking] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<AlertRow[]>('/alerts'));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    const onLive = () => void load();
    window.addEventListener('cg-live', onLive);
    return () => window.removeEventListener('cg-live', onLive);
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    return filter === 'open' ? rows.filter((a) => !a.acknowledgedAt) : rows;
  }, [rows, filter]);

  return (
    <Shell title="Alerts" eyebrow="Inbox">
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Alert filter">
        {(['open', 'all'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`min-h-tap cursor-pointer rounded-pill px-4 text-sm font-semibold ${
              filter === id ? 'bg-forest text-cream' : 'bg-paper text-bark shadow-card'
            }`}
            onClick={() => setFilter(id)}
          >
            {id === 'open' ? 'Open' : 'All'}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 text-alert" role="alert">
          Could not load alerts. Start the API, then refresh.
        </p>
      ) : null}

      {!rows ? <p className="text-bark">Loading alerts…</p> : null}

      {rows && visible.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
          title={filter === 'open' ? 'No open alerts' : 'No alerts'}
          body="Quiet is good. New missed doses and score drops will land here."
        />
      ) : null}

      <ul className="space-y-3">
        {visible.map((a, i) => (
          <li
            key={a.id}
            className="animate-rise flex flex-col gap-4 rounded-card bg-paper p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex min-w-0 gap-4">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                  a.severity === 'critical' ? 'bg-alert text-white' : 'bg-turmeric text-ink'
                }`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-bark">
                  {a.patient.name} · {a.type.replaceAll('_', ' ')} · {a.severity}
                </p>
                <p className="mt-1 text-lg text-forest">{a.message}</p>
                <p className="text-sm tabular text-bark">{formatWhen(a.createdAt)}</p>
              </div>
            </div>
            {!a.acknowledgedAt ? (
              <button
                type="button"
                disabled={acking === a.id}
                className="min-h-tap shrink-0 cursor-pointer rounded-2xl bg-forest px-5 font-semibold text-cream transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-70"
                onClick={async () => {
                  setAcking(a.id);
                  try {
                    await api(`/alerts/${a.id}/ack`, { method: 'PATCH' });
                    await load();
                  } finally {
                    setAcking(null);
                  }
                }}
              >
                {acking === a.id ? 'Saving…' : 'Acknowledge'}
              </button>
            ) : (
              <StatusPill tone="ok">Acknowledged</StatusPill>
            )}
          </li>
        ))}
      </ul>
    </Shell>
  );
}
