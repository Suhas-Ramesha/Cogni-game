'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Radio, Search, Sparkles, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatRelative, formatWhen, initials, langLabel } from '@/lib/format';
import { Shell } from '@/components/Shell';
import { EmptyState, ErrorBanner, Skeleton, StatusPill } from '@/components/ui';

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
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await api<Row[]>('/patients');
        if (!cancelled) {
          setRows(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    const onLive = () => void load();
    window.addEventListener('cg-live', onLive);
    return () => {
      cancelled = true;
      window.removeEventListener('cg-live', onLive);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows ?? [];
    return (rows ?? []).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.pairingCode.includes(q) ||
        langLabel(p.preferredLanguage).toLowerCase().includes(q),
    );
  }, [rows, query]);

  const openAlerts = rows?.reduce((n, p) => n + p.openAlertCount, 0) ?? 0;
  const stale = rows?.filter((p) => !p.lastSyncedAt).length ?? 0;

  return (
    <Shell title="Your patients" eyebrow="Caseload">
      {error ? (
        <ErrorBanner>
          Could not load patients. Check that you are signed in and the API is running, then refresh.
        </ErrorBanner>
      ) : null}

      {rows ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Patients" value={String(rows.length)} icon={<Users className="h-4 w-4" aria-hidden="true" />} />
          <Stat
            label="Open alerts"
            value={String(openAlerts)}
            icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            warn={openAlerts > 0}
          />
          <Stat
            label="Never synced"
            value={String(stale)}
            icon={<Radio className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      ) : null}

      <label className="mb-6 block max-w-md" htmlFor="caseload-search">
        <span className="sr-only">Search patients</span>
        <span className="relative flex">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark" aria-hidden="true" />
          <input
            id="caseload-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, language, or pairing…"
            autoComplete="off"
            name="caseload-search"
            spellCheck={false}
            className="min-h-tap w-full rounded-2xl border border-mist bg-paper pl-11 pr-4 shadow-card"
          />
        </span>
      </label>

      {!rows && !error ? (
        <ul className="grid gap-5 md:grid-cols-2" aria-busy="true" aria-label="Loading caseload">
          {[0, 1].map((i) => (
            <li key={i} className="rounded-card bg-paper p-6 shadow-card">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {rows?.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title="No patients yet"
          body="Pair a device from the mobile app with a 6-digit caregiver code."
        />
      ) : null}

      {rows && filtered.length === 0 && rows.length > 0 ? (
        <p className="text-bark" role="status">
          No patients match “{query}”.
        </p>
      ) : null}

      <ul className="grid gap-5 md:grid-cols-2">
        {filtered.map((p, i) => (
          <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              href={`/patients/${p.id}`}
              className="group block rounded-card bg-paper p-6 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest font-display text-lg text-cream">
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display truncate text-2xl text-forest">{p.name}</h2>
                    <p className="mt-1 text-sm text-bark">
                      {langLabel(p.preferredLanguage)} · pairing{' '}
                      <span className="tabular font-semibold text-ink" translate="no">
                        {p.pairingCode}
                      </span>
                    </p>
                  </div>
                </div>
                {p.openAlertCount > 0 ? (
                  <StatusPill tone="alert">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.openAlertCount} alert{p.openAlertCount > 1 ? 's' : ''}
                  </StatusPill>
                ) : (
                  <StatusPill tone="ok">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Stable
                  </StatusPill>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                <p className="flex min-w-0 items-center gap-2 text-bark" title={formatWhen(p.lastSyncedAt)}>
                  <Radio
                    className={`h-4 w-4 shrink-0 ${p.lastSyncedAt ? 'animate-pulseDot text-canopy' : 'text-alert'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{formatRelative(p.lastSyncedAt)}</span>
                </p>
                <Difficulty level={p.currentDifficulty} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Stat({
  label,
  value,
  icon,
  warn,
}: {
  label: string;
  value: string;
  icon: JSX.IntrinsicElements['p']['children'];
  warn?: boolean;
}) {
  return (
    <div className={`rounded-card bg-paper px-4 py-3 shadow-card ${warn ? 'ring-1 ring-alert/30' : ''}`}>
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-bark">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-2xl tabular text-forest">{value}</p>
    </div>
  );
}

function Difficulty({ level }: { level: number }) {
  return (
    <p className="flex items-center gap-1.5 text-bark" aria-label={`Difficulty ${level} of 5`}>
      <span className="sr-only">Difficulty {level}/5</span>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < level ? 'bg-forest' : 'bg-mist'}`}
          aria-hidden="true"
        />
      ))}
    </p>
  );
}
