export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-mist/80 ${className}`} aria-hidden="true" />;
}

type Kids = JSX.IntrinsicElements['div']['children'];

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: Kids;
}) {
  return (
    <div className="rounded-card bg-paper px-8 py-14 text-center shadow-card">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mist text-canopy">{icon}</div>
      <h2 className="font-display mt-5 text-2xl text-forest">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-bark">{body}</p>
    </div>
  );
}

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: 'ok' | 'alert' | 'warn' | 'neutral';
  children: Kids;
}) {
  const cls =
    tone === 'ok'
      ? 'bg-canopy/10 text-canopy'
      : tone === 'alert'
        ? 'bg-alert text-white'
        : tone === 'warn'
          ? 'bg-turmeric text-ink'
          : 'bg-mist text-bark';
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function ErrorBanner({ children }: { children: Kids }) {
  return (
    <div className="rounded-card border border-alert/20 bg-paper p-6 text-alert" role="alert">
      {children}
    </div>
  );
}
