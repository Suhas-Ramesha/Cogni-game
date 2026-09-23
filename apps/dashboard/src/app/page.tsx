'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, DEMO } from '@/lib/api';
import type { AuthResponse } from '@cognigame/shared-types';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+916000000001');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function demo(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<AuthResponse>('/auth/demo', {
        method: 'POST',
        body: JSON.stringify({ role: 'caregiver', phone }),
      });
      localStorage.setItem('cg_token', res.token);
      localStorage.setItem('cg_caregiver', JSON.stringify(res.caregiver));
      router.push('/patients');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="bg-forest text-cream p-10 lg:p-16 flex flex-col justify-between">
        <p className="uppercase tracking-[0.3em] text-sm text-turmeric">North Eastern Region · India</p>
        <div>
          <h1 className="font-display text-5xl lg:text-6xl leading-tight">CogniGame NER</h1>
          <p className="mt-6 max-w-md text-lg text-mist">
            Caregiver console for memory games, medicine reminders, and wellbeing of elderly
            patients — Assamese, Khasi, and English, offline-first.
          </p>
        </div>
        <p className="text-sm text-mist/80">SIH walkthrough ready · 90% production scaffold</p>
      </section>
      <section className="p-10 lg:p-16 flex items-center">
        <form onSubmit={demo} className="w-full max-w-md space-y-6">
          <h2 className="font-display text-3xl">Sign in</h2>
          <p className="text-bark">Phone OTP via Firebase in production. Demo login is enabled for the SIH seed caregiver.</p>
          <label className="block">
            <span className="text-sm font-semibold">Phone</span>
            <input
              className="mt-2 w-full min-h-tap rounded-2xl border border-bark/20 bg-white px-4 text-lg"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">OTP (production only)</span>
            <input
              className="mt-2 w-full min-h-tap rounded-2xl border border-bark/20 bg-white px-4 text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Firebase OTP"
              disabled
            />
          </label>
          {error ? <p className="text-alert">{error}</p> : null}
          {DEMO ? (
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-tap rounded-2xl bg-turmeric text-ink font-semibold text-lg"
            >
              {busy ? 'Signing in…' : 'Demo sign-in (Anjali Das)'}
            </button>
          ) : (
            <p className="text-alert">Demo auth disabled. Configure Firebase OTP.</p>
          )}
        </form>
      </section>
    </main>
  );
}
