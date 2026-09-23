'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export function Shell({ children, title }: { children: ReactNode; title: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      <header className="bg-forest text-cream px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-turmeric">CogniGame NER</p>
          <h1 className="font-display text-2xl">{title}</h1>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link className="px-4 py-3 rounded-xl bg-white/10" href="/patients">
            Patients
          </Link>
          <Link className="px-4 py-3 rounded-xl bg-white/10" href="/alerts">
            Alerts
          </Link>
          <button
            className="px-4 py-3 rounded-xl bg-turmeric text-ink font-semibold"
            onClick={() => {
              localStorage.clear();
              router.push('/');
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      <div className="p-6 max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
