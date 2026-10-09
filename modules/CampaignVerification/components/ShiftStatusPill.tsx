import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ShiftStatus } from '@/apis/campaign/models/lifecycle';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';
import { SHIFT_STATUS_LABEL, SHIFT_STATUS_TONE } from '@/constants/campaignVerification';

/** A shift's status (spec 4.2): it is "Ended" only once its result is in. */
export const ShiftStatusPill = /* @__PURE__ */ memo(function ShiftStatusPill({
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
export const ShiftReopenedPill = /* @__PURE__ */ memo(function ShiftReopenedPill({
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
export const ShiftReopenedNotice = /* @__PURE__ */ memo(function ShiftReopenedNotice({
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
