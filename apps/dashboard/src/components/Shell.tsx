'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Clock3, Leaf, LogOut, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, api } from '@/lib/api';
import { formatClock } from '@/lib/format';
import { signOut, useCaregiver, useRequireAuth } from '@/lib/auth';

const NAV = [
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export function Shell({
  children,
  title,
  eyebrow,
  actions,
}: {
  children: JSX.IntrinsicElements['main']['children'];
  title: string;
  eyebrow?: string;
  actions?: JSX.IntrinsicElements['div']['children'];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const ready = useRequireAuth();
  const caregiver = useCaregiver();
  const [clock, setClock] = useState('');
  const [openAlerts, setOpenAlerts] = useState(0);

  useEffect(() => {
    const tick = () => setClock(formatClock());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function refresh() {
      try {
        const rows = await api<{ acknowledgedAt: string | null }[]>('/alerts');
        if (!cancelled) setOpenAlerts(rows.filter((a) => !a.acknowledgedAt).length);
      } catch {
        /* dashboard still usable offline-from-API */
      }
    }
    void refresh();
    const caregiverId = caregiver?.id;
    if (!caregiverId) return undefined;
    const socket = io(`${API_URL}/live`, { transports: ['websocket', 'polling'] });
    socket.emit('join', { caregiverId });
    const ping = () => {
      void refresh();
      window.dispatchEvent(new Event('cg-live'));
    };
    socket.on('alert', ping);
    socket.on('sync', ping);
    return () => {
      cancelled = true;
      socket.close();
    };
  }, [ready, caregiver?.id]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-bark">
        <p>Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col bg-forest px-5 py-6 text-cream lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/patients" className="flex items-center gap-3 rounded-2xl px-1 py-1">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-turmeric text-ink">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-turmeric">NER · India</span>
            <span className="font-display text-xl leading-tight" translate="no">
              CogniGame
            </span>
          </span>
        </Link>
        <nav className="mt-8 flex gap-2 lg:mt-10 lg:flex-col" aria-label="Caregiver">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showBadge = item.href === '/alerts' && openAlerts > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-tap items-center gap-3 rounded-2xl px-4 text-sm transition-colors duration-200 ${
                  active ? 'bg-white/15 text-cream' : 'text-mist hover:bg-white/10 hover:text-cream'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {showBadge ? (
                  <span className="tabular rounded-pill bg-turmeric px-2 py-0.5 text-[11px] font-bold text-ink">
                    {openAlerts}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden pt-8 lg:block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mist/80">Signed in</p>
          <p className="mt-1 font-medium">{caregiver?.name ?? 'Caregiver'}</p>
          <p className="text-sm capitalize text-mist">{caregiver?.role?.replaceAll('_', ' ') ?? ''}</p>
          <p className="mt-3 flex items-center gap-2 text-xs tabular text-mist">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            IST {clock || '—'}
          </p>
          <button
            type="button"
            className="mt-4 flex min-h-tap w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-turmeric font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
            onClick={() => signOut(router)}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-end justify-between gap-4 px-6 pb-2 pt-8 lg:px-10">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] uppercase tracking-[0.24em] text-bark">{eyebrow}</p>
            ) : null}
            <h1 className="font-display truncate text-3xl text-forest md:text-4xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <p className="hidden tabular text-sm text-bark md:block">IST {clock || '—'}</p>
            <button
              type="button"
              className="min-h-tap cursor-pointer rounded-2xl px-4 text-sm text-bark lg:hidden"
              onClick={() => signOut(router)}
            >
              Sign out
            </button>
          </div>
        </header>
        <main id="main" className="px-6 pb-16 pt-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
