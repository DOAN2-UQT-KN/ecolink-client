import { useTranslation } from 'react-i18next';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { campaignDateRange } from '@/constants/campaignLifecycle';
import { formattedDate } from '@/utils/formattedDate';

/** "first day – last day", plus "· N days" when the campaign runs on several days. */
export function CampaignDateRange({ campaign }: { campaign?: Pick<ICampaign, 'days'> | null }) {
  const { t } = useTranslation();
  const { start, end, dayCount } = campaignDateRange(campaign ?? {});
  if (!start) return <>—</>;
  return (
    <>
      {formattedDate(start)} - {formattedDate(end)}
      {dayCount > 1 && ` · ${t('{{n}} days', { n: dayCount })}`}
    </>
  );
}

export default CampaignDateRange;
