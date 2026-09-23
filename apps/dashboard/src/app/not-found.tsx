import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-bark">404</p>
        <h1 className="font-display mt-3 text-4xl text-forest">Page not found</h1>
        <p className="mt-3 text-bark">That route is not part of the caregiver console.</p>
        <Link
          href="/patients"
          className="mt-8 inline-flex min-h-tap items-center justify-center rounded-2xl bg-turmeric px-6 font-semibold text-ink"
        >
          Back to patients
        </Link>
      </div>
    </main>
  );
}
