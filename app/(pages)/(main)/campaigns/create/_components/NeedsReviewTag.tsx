import { useTranslation } from 'react-i18next';

import { Pill } from '@/components/ui/Pill';

import { useCampaign } from '../_context/CampaignContext';

/** On an approved campaign, marks a field whose change sends it back for review (spec 3.5). */
export function NeedsReviewTag() {
  const { t } = useTranslation();
  const { approvedEdit } = useCampaign();
  if (!approvedEdit) return null;
  return (
    <Pill tone="amber" className="ml-1 align-middle">
      {t('Needs review again')}
    </Pill>
  );
}

export default NeedsReviewTag;
