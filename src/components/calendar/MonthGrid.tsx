import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export interface MonthGridProps {
  /** Any date in the month to display. */
  anchor: Date;
  /** Render a cell for a calendar date (yyyy-MM-dd). */
  renderCell: (isoDate: string) => React.ReactNode;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthGrid({ anchor, renderCell }: MonthGridProps) {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const cells: { iso: string; inMonth: boolean; dayNum: string }[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    const iso = format(d, 'yyyy-MM-dd');
    const inMonth = d >= monthStart && d <= monthEnd;
    cells.push({ iso, inMonth, dayNum: format(d, 'd') });
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">
        {WEEKDAYS.map(w => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ iso, inMonth, dayNum }) => (
          <div
            key={iso}
            className={`min-h-[5.5rem] rounded-xl border p-1.5 text-left flex flex-col ${
              inMonth ? 'border-border bg-surface/80' : 'border-transparent bg-transparent opacity-40'
            }`}
          >
            {inMonth && (
              <>
                <span className="text-xs font-semibold text-ink mb-1">{dayNum}</span>
                <div className="flex-1 min-h-0 overflow-hidden text-[10px] leading-tight">
                  {renderCell(iso)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { parseISO };
