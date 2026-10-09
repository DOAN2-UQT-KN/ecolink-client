import { useTranslation } from 'react-i18next';

import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

import { useCampaign } from '../_context/CampaignContext';
import { useShiftRules } from '../_hooks/useShiftRules';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

/** Why a day has fewer volunteers than the difficulty suggests (shown only then). */
export default function MinVolunteersReasonField() {
  const { t } = useTranslation();
  const { form, suggestedMinPerDay } = useCampaign();
  const rules = useShiftRules();

  return (
    <Field>
      <FieldLabel className="text-foreground-tertiary font-display-3">
        {t('Why fewer volunteers than suggested')} <span className="text-destructive">*</span>
        <InfoTooltip
          content={t(
            'This difficulty suggests at least {{n}} volunteers per day. Explain why fewer are enough; the admin reads this when reviewing.',
            { n: suggestedMinPerDay },
          )}
        />
      </FieldLabel>
      <Textarea
        rows={3}
        maxLength={1000}
        {...form.register('min_volunteers_reason', rules.minReason)}
        className={inputClassName}
      />
      <FieldError errors={[form.formState.errors.min_volunteers_reason]} />
    </Field>
  );
}
