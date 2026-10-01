import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCampaign } from '../_hooks/useCampaign';
import { CAMPAIGN_STEPS } from '../_context/CampaignContext';
import { CampaignSummary } from './CampaignSummary';

/** Last step: everything the admin will see, with a way back to each step. */
const StepReview = memo(function StepReview() {
  const { t } = useTranslation();
  const { form, organization, maxPerDay, goToStep } = useCampaign();
  const values = form.watch();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display-5 font-semibold !text-button-accent">
        {t('Review & submit')}
      </h2>
      <CampaignSummary
        values={values}
        organizationName={organization?.name}
        maxPerDay={maxPerDay}
        onEdit={(step) => goToStep(CAMPAIGN_STEPS.indexOf(step))}
      />
    </div>
  );
});

export default StepReview;
