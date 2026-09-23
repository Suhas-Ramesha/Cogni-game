import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

export const firebaseWebReady = Boolean(apiKey && authDomain && projectId);

export function firebaseAuth(): Auth | null {
  if (!firebaseWebReady || typeof window === 'undefined') return null;
  const app: FirebaseApp = getApps()[0] ??
    initializeApp({
      apiKey,
      authDomain,
      projectId,
    });
  return getAuth(app);
}
