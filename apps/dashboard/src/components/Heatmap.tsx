import { lastNDays, weekdayShort } from '@/lib/format';

export function Heatmap({ cells }: { cells: { date: string; count: number }[] }) {
  const days = lastNDays(14);
  const counts = new Map(cells.map((c) => [c.date, c.count]));
  const max = Math.max(1, ...days.map((d) => counts.get(d) ?? 0));
  const total = days.reduce((sum, d) => sum + (counts.get(d) ?? 0), 0);

  return (
    <div>
      <p className="sr-only">
        {total} play sessions across the last 14 days.
      </p>
      <div className="grid grid-cols-7 gap-2" role="img" aria-label="Daily play heatmap, last 14 days">
        {days.map((date) => {
          const count = counts.get(date) ?? 0;
          const t = count / max;
          return (
            <div key={date} className="text-center">
              <div
                className="mx-auto h-10 w-full max-w-10 rounded-xl"
                style={{
                  background:
                    count === 0 ? '#E4EDE6' : `rgba(31, 111, 74, ${0.22 + t * 0.78})`,
                }}
                title={`${date}: ${count} session${count === 1 ? '' : 's'}`}
                aria-label={`${date}: ${count} session${count === 1 ? '' : 's'}`}
              />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-bark">{weekdayShort(date).slice(0, 2)}</p>
              <p className="tabular text-[10px] text-bark/80">{date.slice(8)}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-bark">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-mist" />
        <span className="h-3 w-3 rounded-sm bg-canopy/30" />
        <span className="h-3 w-3 rounded-sm bg-canopy/60" />
        <span className="h-3 w-3 rounded-sm bg-canopy" />
        <span>More</span>
        <span className="ml-auto tabular">{total} sessions</span>
      </div>
    </div>
  );
}
