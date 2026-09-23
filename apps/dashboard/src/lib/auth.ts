'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CaregiverDto } from '@cognigame/shared-types';

export function readCaregiver(): CaregiverDto | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('cg_caregiver') || 'null') as CaregiverDto | null;
  } catch {
    return null;
  }
}

export function useCaregiver() {
  const [caregiver, setCaregiver] = useState<CaregiverDto | null>(null);
  useEffect(() => {
    setCaregiver(readCaregiver());
  }, []);
  return caregiver;
}

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('cg_token')) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);
  return ready;
}

export function signOut(router: { push: (href: string) => void }) {
  localStorage.removeItem('cg_token');
  localStorage.removeItem('cg_caregiver');
  router.push('/');
}
