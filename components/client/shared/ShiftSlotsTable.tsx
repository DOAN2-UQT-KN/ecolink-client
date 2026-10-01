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
  /** `admin` follows the admin console tables (theme tokens, no grid lines). */
  variant?: 'client' | 'admin';
}

const STYLES = {
  client: {
    wrapper: 'overflow-x-auto',
    headRow: 'bg-[#887A47]/10',
    head: 'border border-[rgba(136,122,71,0.3)] px-3 py-2 align-top text-left font-semibold whitespace-nowrap',
    row: '',
    cell: 'border border-[rgba(136,122,71,0.3)] px-3 py-2 align-top',
    groupStart: '',
    groupEnd: '',
  },
  admin: {
    wrapper: 'overflow-x-auto rounded-md border border-border bg-card',
    headRow: 'bg-muted border-b border-border',
    head: 'px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap',
    row: 'border-b border-border last:border-b-0 hover:bg-muted/50',
    cell: 'px-3 py-2.5 align-top font-display-1 text-foreground',
    groupStart: 'border-r border-border',
    groupEnd: 'border-l border-border',
  },
} as const;

/**
 * Read-only list of a campaign's shifts: one row per day × meeting point with its slots,
 * gathering time and person in charge; the day and its volunteer total span its rows.
 */
export const ShiftSlotsTable = memo(function ShiftSlotsTable({
  days,
  points,
  cells,
  maxPerDay,
  variant = 'client',
}: ShiftSlotsTableProps) {
  const { t } = useTranslation();
  const style = STYLES[variant];
  const cell = style.cell;
  const headers = [
    t('Day'),
    t('Meeting point'),
    t('Volunteers'),
    t('Gathering time'),
    t('Person in charge'),
    t('Total volunteers'),
  ];

  return (
    <div className={style.wrapper}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={style.headRow}>
            {headers.map((header) => (
              <th key={header} className={style.head}>
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
                    <tr key={p} className={style.row}>
                      {p === 0 && (
                        <td rowSpan={span} className={cn(cell, style.groupStart, 'whitespace-nowrap')}>
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
                            style.groupEnd,
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
