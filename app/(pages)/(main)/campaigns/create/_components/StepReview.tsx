import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';

import { useCampaign } from '../_context/CampaignContext';
import { CAMPAIGN_STEPS } from '../_services/campaignSteps.service';
import type { CampaignFormValues } from '../_services/campaignForm.service';
import { CampaignSummary } from './CampaignSummary';

/** Last step: everything the admin will see, with a way back to each step. */
const StepReview = memo(function StepReview() {
  const { t } = useTranslation();
  const { form, organization, suggestedMinPerDay, goToStep } = useCampaign();
  // useWatch, not form.watch(): watch() would re-render the whole wizard provider on every keystroke.
  // cast: useWatch returns a deep-partial type; the form always holds full defaults.
  const values = useWatch({ control: form.control }) as CampaignFormValues;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display-5 font-semibold !text-button-accent">
        {t('Review & submit')}
      </h2>
      <CampaignSummary
        values={values}
        organizationName={organization?.name}
        suggestedMinPerDay={suggestedMinPerDay}
        onEdit={(step) => goToStep(CAMPAIGN_STEPS.indexOf(step))}
      />
    </div>
  );
});

export default StepReview;
