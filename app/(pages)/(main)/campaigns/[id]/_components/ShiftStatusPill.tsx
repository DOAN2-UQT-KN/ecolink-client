import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ShiftStatus } from '@/apis/campaign/models/lifecycle';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';

export const SHIFT_STATUS_TONE: Record<ShiftStatus, PillTone> = {
  upcoming: 'blue',
  running: 'cyan',
  awaiting_result: 'amber',
  ended: 'green',
  off: 'neutral',
};

/** English label of a shift status; translate with `t()`. */
export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  upcoming: 'Not started',
  running: 'Running',
  awaiting_result: 'Awaiting result',
  ended: 'Ended',
  off: 'Turned off',
};

/** A shift's status (spec 4.2): it is "Ended" only once its result is in. */
export const ShiftStatusPill = memo(function ShiftStatusPill({
  status,
  className,
}: {
  status: ShiftStatus;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <Pill tone={SHIFT_STATUS_TONE[status]} className={className}>
      {t(SHIFT_STATUS_LABEL[status])}
    </Pill>
  );
});

/**
 * Result verification did not accept a waste point of this shift (or the admin rejected it): the
 * shift is back to "Awaiting result" until its result is saved again. The reason shows on hover.
 */
export const ShiftReopenedPill = memo(function ShiftReopenedPill({
  reason,
  className,
}: {
  reason?: string | null;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <Pill tone="red" className={className} title={reason ? `${t('Reason')}: ${reason}` : undefined}>
      {t('Needs more')}
    </Pill>
  );
});

/** Why the shift was reopened (per waste point), with what to do next. */
export const ShiftReopenedNotice = memo(function ShiftReopenedNotice({
  reason,
  className,
}: {
  reason?: string | null;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <div
      role="status"
      className={cn('rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900', className)}
    >
      <span className="font-semibold">{t('A waste point of this shift was not accepted.')}</span>{' '}
      {reason ? `${t('Reason')}: ${reason}. ` : ''}
      {t('Save its result again, then mark the campaign done again.')}
    </div>
  );
});
