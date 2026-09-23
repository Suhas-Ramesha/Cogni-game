'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { Shell } from '../../components/Shell';
import type { PatientDetailDto } from '@cognigame/shared-types';

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PatientDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PatientDetailDto>(`/patients/${params.id}`)
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, [params.id]);

  if (error) {
    return (
      <Shell title="Patient">
        <p className="text-alert">{error}</p>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell title="Patient">
        <p>Loading…</p>
      </Shell>
    );
  }

  const chart = data.sessions
    .filter((s) => s.gameType !== 'emotional_engagement')
    .map((s) => ({
      t: new Date(s.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      score: s.score,
      accuracy: Math.round(s.accuracy * 100),
      game: s.gameType,
    }));

  const moodChart = data.moods.map((m) => ({
    t: new Date(m.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    mood: { joyful: 5, calm: 4, okay: 3, sad: 2, anxious: 1 }[m.mood] ?? 3,
  }));

  const maxHeat = Math.max(1, ...data.heatmap.map((h) => h.count));

  return (
    <Shell title={data.patient.name}>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Language" value={data.patient.preferredLanguage.toUpperCase()} />
        <Stat
          label="Last synced"
          value={
            data.patient.lastSyncedAt
              ? new Date(data.patient.lastSyncedAt).toLocaleString('en-IN')
              : 'offline'
          }
        />
        <Stat
          label="Reminder compliance"
          value={`${data.compliance.completed}/${data.compliance.completed + data.compliance.missed || 0} taken`}
        />
        <Stat label="Pairing code" value={data.patient.pairingCode} />
      </div>

      {data.alerts.filter((a) => !a.acknowledgedAt).length > 0 ? (
        <div className="mb-6 space-y-2">
          {data.alerts
            .filter((a) => !a.acknowledgedAt)
            .map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl px-4 py-3 ${a.severity === 'critical' ? 'bg-alert text-white' : 'bg-turmeric text-ink'}`}
              >
                <strong className="uppercase text-xs tracking-wide">{a.type.replace('_', ' ')}</strong>
                <p>{a.message}</p>
              </div>
            ))}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-6 border border-bark/10 mb-6">
        <h2 className="font-display text-2xl mb-4">Cognitive trend (14 days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#0F3D2E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accuracy" stroke="#E0A100" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 border border-bark/10 mb-6">
        <h2 className="font-display text-2xl mb-4">Daily play heatmap</h2>
        <div className="flex flex-wrap gap-2">
          {data.heatmap.map((cell) => (
            <div key={cell.date} className="text-center">
              <div
                className="w-10 h-10 rounded-lg"
                style={{ background: `rgba(31, 111, 74, ${0.15 + (cell.count / maxHeat) * 0.85})` }}
                title={`${cell.date}: ${cell.count} sessions`}
              />
              <p className="text-[10px] mt-1 text-bark">{cell.date.slice(8)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 border border-bark/10 mb-6">
        <h2 className="font-display text-2xl mb-4">Wellbeing</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis domain={[1, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#9B1D20" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 border border-bark/10">
        <h2 className="font-display text-2xl mb-4">Reminders</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-bark text-sm">
              <th className="py-2">When</th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.reminders.slice(0, 12).map((r) => (
              <tr key={r.id} className="border-t border-mist">
                <td className="py-2">{new Date(r.scheduledTime).toLocaleString('en-IN')}</td>
                <td>{r.type}</td>
                <td>{r.title}</td>
                <td className={r.status === 'missed' ? 'text-alert font-semibold' : 'text-canopy'}>
                  {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 border border-bark/10">
      <p className="text-xs uppercase tracking-wide text-bark">{label}</p>
      <p className="font-semibold mt-1 break-all">{value}</p>
    </div>
  );
}
