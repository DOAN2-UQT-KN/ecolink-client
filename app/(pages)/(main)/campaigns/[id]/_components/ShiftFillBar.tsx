import { useTranslation } from 'react-i18next';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/libs/utils';

/**
 * How full a shift is: registrations against the expected maximum (or the minimum when there is
 * none), with a tick at the minimum. Drawn in the theme accent; only "over the expected number"
 * is called out in red.
 */
export function ShiftFillBar({
  registered,
  min,
  max,
  className,
}: {
  registered: number;
  min: number;
  max?: number | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const scale = Math.max(max ?? min, 1);
  const value = Math.min(100, Math.round((registered / scale) * 100));
  const short = Math.max(0, min - registered);
  const over = max != null && registered > max;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="relative">
        <Progress
          value={value}
          className="h-2 bg-button-accent/15 [&>[data-slot=progress-indicator]]:bg-button-accent"
        />
        {max != null && min > 0 && min < max && (
          <span
            aria-hidden
            className="absolute top-[-2px] h-3 w-0.5 rounded bg-button-accent/60"
            style={{ left: `${(min / max) * 100}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
        <span className="font-medium text-button-accent">
          {registered} / {min}
          {max != null ? ` – ${max}` : '+'}
        </span>
        <span
          className={cn(
            'font-medium',
            over ? 'text-red-700' : short > 0 ? 'text-button-accent/80' : 'font-semibold text-button-accent',
          )}
        >
          {over
            ? t('Over the expected number')
            : short > 0
              ? t('{{n}} more needed', { n: short })
              : t('Enough volunteers')}
        </span>
      </div>
    </div>
  );
}
