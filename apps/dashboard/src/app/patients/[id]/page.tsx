'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ArrowLeft, Bell, CalendarClock, Languages, Radio } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDay, formatWhen, langLabel } from '@/lib/format';
import { Shell } from '@/components/Shell';
import { Heatmap } from '@/components/Heatmap';
import { StatusPill } from '@/components/ui';
import type { PatientDetailDto } from '@cognigame/shared-types';

const MOOD_SCORE: Record<string, number> = { joyful: 5, calm: 4, okay: 3, sad: 2, anxious: 1 };

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PatientDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acking, setAcking] = useState<string | null>(null);

  async function load() {
    const next = await api<PatientDetailDto>(`/patients/${params.id}`);
    setData(next);
  }

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const chart = useMemo(
    () =>
      (data?.sessions ?? [])
        .filter((s) => s.gameType !== 'emotional_engagement')
        .map((s) => ({
          t: formatDay(s.completedAt),
          score: s.score,
          accuracy: Math.round(s.accuracy * 100),
        })),
    [data],
  );

  const moodChart = useMemo(
    () =>
      (data?.moods ?? []).map((m) => ({
        t: formatDay(m.recordedAt),
        mood: MOOD_SCORE[m.mood] ?? 3,
      })),
    [data],
  );

  if (error) {
    return (
      <Shell title="Patient">
        <p className="text-alert" role="alert">
          {error}
        </p>
        <Link href="/patients" className="mt-4 inline-flex min-h-tap items-center gap-2 text-forest">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to patients
        </Link>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell title="Patient">
        <p className="text-bark">Loading chart…</p>
      </Shell>
    );
  }

  const totalRem = data.compliance.completed + data.compliance.missed;
  const openAlerts = data.alerts.filter((a) => !a.acknowledgedAt);
  const avgScore =
    chart.length === 0 ? null : Math.round(chart.reduce((s, r) => s + r.score, 0) / chart.length);
  const first = chart[0]?.score;
  const last = chart.at(-1)?.score;
  const trend =
    first == null || last == null ? null : last - first > 4 ? 'rising' : first - last > 4 ? 'falling' : 'steady';

  return (
    <Shell
      title={data.patient.name}
      eyebrow="Patient file"
      actions={
        <Link
          href="/patients"
          className="inline-flex min-h-tap items-center gap-2 rounded-2xl px-3 text-sm text-bark hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Caseload
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Languages} label="Language" value={langLabel(data.patient.preferredLanguage)} />
        <Kpi icon={Radio} label="Last synced" value={formatWhen(data.patient.lastSyncedAt)} />
        <Kpi
          icon={CalendarClock}
          label="Reminders taken"
          value={`${data.compliance.completed}/${totalRem || 0}`}
        />
        <Kpi icon={Activity} label="Pairing code" value={data.patient.pairingCode} mono />
      </div>

      {openAlerts.length > 0 ? (
        <div className="mt-6 space-y-3" aria-live="polite">
          {openAlerts.map((a) => (
            <div
              key={a.id}
              className={`flex flex-col gap-3 rounded-card px-5 py-4 sm:flex-row sm:items-center ${
                a.severity === 'critical' ? 'bg-alert text-white' : 'bg-turmeric text-ink'
              }`}
            >
              <Bell className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {a.type.replaceAll('_', ' ')}
                </p>
                <p className="mt-1">{a.message}</p>
              </div>
              <button
                type="button"
                disabled={acking === a.id}
                className="min-h-tap shrink-0 cursor-pointer rounded-2xl bg-paper/95 px-4 font-semibold text-forest disabled:opacity-70"
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
            </div>
          ))}
        </div>
      ) : null}

      <section className="mt-6 rounded-card bg-paper p-6 shadow-card">
        <h2 className="font-display text-2xl text-forest">Cognitive trend · 14 days</h2>
        <p className="mt-1 text-sm text-bark">
          Solid forest line is score. Dashed turmeric line is accuracy percent — not color-only.
          {avgScore != null ? ` Average score ${avgScore}. Trend is ${trend}.` : ' No scored sessions yet.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-bark">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-forest" aria-hidden="true" /> Score
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 border-t-2 border-dashed border-turmeric" aria-hidden="true" /> Accuracy %
          </span>
        </div>
        {chart.length < 2 ? (
          <p className="mt-8 text-bark">Need at least two scored sessions to draw a trend.</p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F6F4A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1F6F4A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E4EDE6" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#5C4A3A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5C4A3A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: '1px solid #E4EDE6', fontFamily: 'inherit' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#0F3D2E"
                  fill="url(#scoreFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke="#E0A100"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {chart.length > 0 ? (
          <table className="sr-only">
            <caption>Score and accuracy by day</caption>
            <thead>
              <tr>
                <th>Day</th>
                <th>Score</th>
                <th>Accuracy %</th>
              </tr>
            </thead>
            <tbody>
              {chart.map((row, i) => (
                <tr key={`${row.t}-${i}`}>
                  <td>{row.t}</td>
                  <td>{row.score}</td>
                  <td>{row.accuracy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card bg-paper p-6 shadow-card">
          <h2 className="font-display text-2xl text-forest">Daily play</h2>
          <p className="mt-1 text-sm text-bark">Last 14 days in Asia/Kolkata. Empty cells mean no session that day.</p>
          <div className="mt-5">
            <Heatmap cells={data.heatmap} />
          </div>
        </section>
        <section className="rounded-card bg-paper p-6 shadow-card">
          <h2 className="font-display text-2xl text-forest">Wellbeing</h2>
          <p className="text-sm text-bark">5 joyful · 4 calm · 3 okay · 2 sad · 1 anxious</p>
          {moodChart.length < 2 ? (
            <p className="mt-8 text-bark">No mood check-ins in this window.</p>
          ) : (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodChart}>
                  <CartesianGrid stroke="#E4EDE6" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: '#5C4A3A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fill: '#5C4A3A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    name="Mood"
                    stroke="#9B1D20"
                    fill="#9B1D20"
                    fillOpacity={0.08}
                    strokeDasharray="4 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-card bg-paper shadow-card">
        <div className="border-b border-mist px-6 py-4">
          <h2 className="font-display text-2xl text-forest">Reminders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-bark">
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.reminders.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-bark" colSpan={4}>
                    No reminders on file.
                  </td>
                </tr>
              ) : (
                data.reminders.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t border-mist">
                    <td className="px-6 py-3 tabular text-sm">{formatWhen(r.scheduledTime)}</td>
                    <td className="px-6 py-3 capitalize text-sm">{r.type.replaceAll('_', ' ')}</td>
                    <td className="px-6 py-3">{r.title}</td>
                    <td className="px-6 py-3">
                      <StatusPill
                        tone={r.status === 'missed' ? 'alert' : r.status === 'completed' ? 'ok' : 'warn'}
                      >
                        {r.status}
                      </StatusPill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-card bg-paper p-4 shadow-card">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-bark">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-2 break-all font-semibold text-forest ${mono ? 'tabular' : ''}`}>{value}</p>
    </div>
  );
}
