import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { CampaignFormValues } from '../_services/campaign.service';
import { parseApiDate } from '../_components/ScheduleFields';

/** "Day 1 · Oct 5" */
export function useDayLabel() {
  const { t } = useTranslation();
  return useCallback(
    (day: CampaignFormValues['days'][number], index: number) => {
      const date = parseApiDate(day.date);
      return date
        ? `${t('Day {{n}}', { n: index + 1 })} · ${format(date, 'PP')}`
        : t('Day {{n}}', { n: index + 1 });
    },
    [t],
  );
}
