import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ShiftStatus } from '@/apis/campaign/models/lifecycle';
import { Pill, type PillTone } from '@/components/ui/Pill';

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
