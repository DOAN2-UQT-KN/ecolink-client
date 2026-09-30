import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/libs/utils';

export interface ShiftSlotsTableProps {
  /** One label per day, e.g. "Day 1 · Oct 5 · 07:00–11:00". */
  days: string[];
  points: string[];
  /** `slots[day][point]`; 0 or null = off. */
  slots: (number | null)[][];
  /** Volunteers allowed per day; totals above it are highlighted. */
  maxPerDay?: number | null;
  isDark?: boolean;
}

/** Read-only day × meeting point grid of volunteer slots, with a total per day. */
export const ShiftSlotsTable = memo(function ShiftSlotsTable({
  days,
  points,
  slots,
  maxPerDay,
  isDark = false,
}: ShiftSlotsTableProps) {
  const { t } = useTranslation();
  const border = isDark ? 'border-zinc-700' : 'border-[rgba(136,122,71,0.3)]';

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', border)}>
        <thead>
          <tr className={isDark ? 'bg-zinc-800' : 'bg-[#887A47]/10'}>
            <th className={cn('border px-3 py-2 text-left font-semibold', border)}>{t('Day')}</th>
            {points.map((name, p) => (
              <th key={p} className={cn('border px-3 py-2 text-left font-semibold', border)}>
                {name}
              </th>
            ))}
            <th className={cn('border px-3 py-2 text-left font-semibold', border)}>
              {t('Total per day')}
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((label, d) => {
            const row = slots[d] ?? [];
            const total = row.reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
            const over = maxPerDay != null && total > maxPerDay;
            return (
              <tr key={d}>
                <td className={cn('border px-3 py-2', border)}>{label}</td>
                {points.map((_, p) => {
                  const value = row[p];
                  const off = !value;
                  return (
                    <td
                      key={p}
                      className={cn(
                        'border px-3 py-2 tabular-nums',
                        border,
                        off && 'text-muted-foreground',
                      )}
                    >
                      {off ? `0 (${t('Off')})` : value}
                    </td>
                  );
                })}
                <td
                  className={cn(
                    'border px-3 py-2 font-semibold tabular-nums',
                    border,
                    over && 'text-destructive',
                  )}
                >
                  {total}
                  {maxPerDay != null && ` / ${maxPerDay}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default ShiftSlotsTable;
