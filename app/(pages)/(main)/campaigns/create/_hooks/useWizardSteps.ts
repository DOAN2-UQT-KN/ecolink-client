import { useCallback, useState } from 'react';

import { CAMPAIGN_STEPS, type CampaignStep } from '../_services/campaignSteps.service';

/**
 * Current wizard step and how far the user got. `startComplete`: an existing campaign is complete
 * enough to open any step.
 */
export function useWizardSteps(initialStep: CampaignStep | undefined, startComplete: boolean) {
  const [stepIndex, setStepIndex] = useState(() =>
    initialStep && CAMPAIGN_STEPS.includes(initialStep) ? CAMPAIGN_STEPS.indexOf(initialStep) : 0,
  );
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(
    startComplete ? CAMPAIGN_STEPS.length - 1 : 0,
  );
  const step = CAMPAIGN_STEPS[stepIndex];

  const showStep = useCallback((index: number) => {
    setStepIndex(index);
    setMaxVisitedIndex((prev) => Math.max(prev, index));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const back = useCallback(() => {
    if (stepIndex > 0) showStep(stepIndex - 1);
  }, [showStep, stepIndex]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index <= maxVisitedIndex) showStep(index);
    },
    [maxVisitedIndex, showStep],
  );

  return { step, stepIndex, maxVisitedIndex, showStep, back, goToStep };
}
