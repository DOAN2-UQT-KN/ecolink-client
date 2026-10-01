import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/libs/utils';

export interface ShiftSlotsCell {
  /** 0 or null = the shift is off. */
  slots: number | null;
  /** "HH:mm" */
  gatherTime?: string | null;
  /** Display name of the person in charge. */
  leader?: string | null;
}

export interface ShiftSlotsTableProps {
  /** One entry per day, e.g. { label: "Day 1 · Oct 5, 2026", hours: "07:00 – 11:00" }. */
  days: { label: string; hours: string }[];
  points: string[];
  /** `cells[day][point]` */
  cells: ShiftSlotsCell[][];
  /** Volunteers allowed per day; totals above it are highlighted. */
  maxPerDay?: number | null;
  isDark?: boolean;
}

/**
 * Read-only list of a campaign's shifts: one row per day × meeting point with its slots,
 * gathering time and person in charge; the day and its volunteer total span its rows.
 */
export const ShiftSlotsTable = memo(function ShiftSlotsTable({
  days,
  points,
  cells,
  maxPerDay,
  isDark = false,
}: ShiftSlotsTableProps) {
  const { t } = useTranslation();
  const border = isDark ? 'border-zinc-700' : 'border-[rgba(136,122,71,0.3)]';
  const cell = cn('border px-3 py-2 align-top', border);
  const headers = [
    t('Day'),
    t('Meeting point'),
    t('Volunteers'),
    t('Gathering time'),
    t('Person in charge'),
    t('Total volunteers'),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={isDark ? 'bg-zinc-800' : 'bg-[#887A47]/10'}>
            {headers.map((header) => (
              <th key={header} className={cn(cell, 'text-left font-semibold whitespace-nowrap')}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, d) => {
            const row = cells[d] ?? [];
            const total = row.reduce<number>((sum, c) => sum + (Number(c?.slots) || 0), 0);
            const over = maxPerDay != null && total > maxPerDay;
            const span = Math.max(points.length, 1);
            return (
              <Fragment key={d}>
                {points.map((point, p) => {
                  const shift = row[p];
                  const off = !shift?.slots;
                  return (
                    <tr key={p}>
                      {p === 0 && (
                        <td rowSpan={span} className={cn(cell, 'whitespace-nowrap')}>
                          <div className="font-medium">{day.label}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {day.hours}
                          </div>
                        </td>
                      )}
                      <td className={cn(cell, off && 'text-muted-foreground')}>{point}</td>
                      <td className={cn(cell, 'tabular-nums', off && 'text-muted-foreground')}>
                        {off ? `0 (${t('Off')})` : shift?.slots}
                      </td>
                      <td className={cn(cell, 'tabular-nums', off && 'text-muted-foreground')}>
                        {off ? '—' : shift?.gatherTime || '—'}
                      </td>
                      <td className={cn(cell, off && 'text-muted-foreground')}>
                        {off ? '—' : shift?.leader || '—'}
                      </td>
                      {p === 0 && (
                        <td
                          rowSpan={span}
                          className={cn(
                            cell,
                            'font-semibold tabular-nums whitespace-nowrap',
                            over && 'text-destructive',
                          )}
                        >
                          {total}
                          {maxPerDay != null && ` / ${maxPerDay}`}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default ShiftSlotsTable;
