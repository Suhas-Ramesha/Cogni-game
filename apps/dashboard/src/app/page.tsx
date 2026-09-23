'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Leaf, Phone, ShieldCheck, WifiOff } from 'lucide-react';
import { api, DEMO } from '@/lib/api';
import type { AuthResponse } from '@cognigame/shared-types';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+916000000001');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('cg_token')) router.replace('/patients');
  }, [router]);

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
      setError(
        (err as Error).message.replace(/[{}"]/g, ' ').trim() ||
          'Could not sign in. Start the API (`pnpm dev:api`) and seed data, then try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-canopy/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-turmeric/20 blur-3xl" />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <section className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-pill bg-forest px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-turmeric">
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
            North Eastern Region · India
          </p>
          <h1 className="font-display mt-6 text-5xl leading-[1.05] text-forest md:text-6xl" translate="no">
            CogniGame NER
          </h1>
          <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-bark">
            A calm console for families and health workers watching memory, medicine, and mood —
            Assamese, Khasi, and English, even when the village network drops.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-bark">
            <li className="flex gap-3">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-canopy" aria-hidden="true" />
              Offline-first games on the patient’s tablet
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-canopy" aria-hidden="true" />
              Live alerts for missed doses and sudden score drops
            </li>
            <li className="flex gap-3">
              <Languages className="mt-0.5 h-4 w-4 shrink-0 text-canopy" aria-hidden="true" />
              Designed for Assamese, Khasi, and English households
            </li>
          </ul>
          <div className="mt-10 flex flex-wrap gap-2" aria-label="Supported languages">
            {['English', 'অসমীয়া', 'Khasi'].map((lang) => (
              <span
                key={lang}
                className="rounded-pill border border-mist bg-paper px-3 py-1 text-xs font-semibold text-forest"
              >
                {lang}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-card bg-paper p-8 shadow-card md:p-10">
          <h2 className="font-display text-2xl text-forest">Sign in</h2>
          <p className="mt-2 text-sm text-bark">
            Production uses Firebase phone OTP. This demo opens Anjali Das’s seeded caseload.
          </p>
          <form onSubmit={demo} className="mt-8 space-y-5">
            <label className="block" htmlFor="phone">
              <span className="text-sm font-semibold text-forest">Phone</span>
              <span className="relative mt-2 flex">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark" aria-hidden="true" />
                <input
                  id="phone"
                  className="min-h-tap w-full rounded-2xl border border-mist bg-cream/60 pl-11 pr-4 text-lg tabular"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  spellCheck={false}
                  placeholder="+91 60000 00001…"
                />
              </span>
            </label>
            {error ? (
              <p className="rounded-2xl bg-alert/10 px-4 py-3 text-sm text-alert" role="alert">
                {error}
              </p>
            ) : null}
            {DEMO ? (
              <button
                type="submit"
                disabled={busy}
                className="flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-2xl bg-turmeric text-lg font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-70"
              >
                {busy ? 'Signing in…' : 'Demo sign-in (Anjali Das)'}
              </button>
            ) : (
              <p className="text-alert" role="alert">
                Demo auth is disabled. Configure Firebase OTP.
              </p>
            )}
          </form>
          <p className="mt-6 text-xs leading-relaxed text-bark">
            Pair a patient tablet with code <span className="tabular font-semibold text-ink">482193</span> (Rita) or{' '}
            <span className="tabular font-semibold text-ink">719204</span> (Bah).
          </p>
        </section>
      </div>
    </main>
  );
}
