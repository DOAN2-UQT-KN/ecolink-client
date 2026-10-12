import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/libs/utils';

import { useCampaign } from '../_context/CampaignContext';
import { useShiftRules } from '../_hooks/useShiftRules';
import { dayHours } from '../_services/shiftSchedule.service';
import ShiftTimeWindow from './ShiftTimeWindow';
import ShiftLeaderSelect from './ShiftLeaderSelect';
import type { ShiftsViewProps } from './StepShifts';
import { inputClassName } from '../_services/fieldStyles';

/** A one-day, one-point campaign: a single set of fields instead of the grid. */
export default function ShiftsSingleForm({
  days,
  schedule,
  members,
  belowSuggestion,
  dayMessages,
  cellErrors,
  dayLabel,
  pointName,
}: ShiftsViewProps) {
  const { t } = useTranslation();
  const { form, suggestedMinPerDay, approvedEdit } = useCampaign();
  const { register } = form;
  const rules = useShiftRules();
  const errors = cellErrors(0, 0);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('Volunteers')}
        </span>
        <InfoTooltip
          content={t(
            'Each row is a shift: one meeting point on one day. Enter the minimum volunteers it needs (0 turns it off) and, optionally, the most you expect. Neither number blocks sign-ups; they only raise warnings.',
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field className="md:col-span-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Volunteers needed')} <span className="text-destructive">*</span>
            <InfoTooltip
              content={t(
                'Minimum – expected maximum (optional). 0 as the minimum turns the shift off.',
              )}
            />
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              aria-label={t('Min')}
              placeholder={t('Min')}
              {...register('schedule.0.0.min_volunteers', rules.min(0, 0))}
              className={cn(inputClassName, 'w-[120px]')}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={1}
              aria-label={t('Max (optional)')}
              placeholder={t('Max (optional)')}
              {...register('schedule.0.0.max_volunteers', rules.max(0, 0))}
              className={cn(inputClassName, 'w-[160px]')}
            />
          </div>
          {belowSuggestion.includes(0) && (
            <span className="text-xs text-amber-600">
              {t('Suggested ≥ {{n}}', { n: suggestedMinPerDay })}
            </span>
          )}
          <FieldError errors={[errors?.min_volunteers, errors?.max_volunteers]} />
        </Field>
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Shift time')}
            <InfoTooltip
              content={
                approvedEdit
                  ? t("New hours of an existing shift send the campaign back for review; numbers and the person in charge save at once.")
                  : t("A shift runs during the day's hours unless you narrow it.")
              }
            />
          </FieldLabel>
          <ShiftTimeWindow
            d={0}
            p={0}
            day={days[0]}
            label={`${dayLabel(days[0], 0)} · ${pointName(0)}`}
          />
          <span className="text-xs text-foreground-tertiary">
            {dayLabel(days[0], 0)} · {dayHours(days[0])}
          </span>
          <FieldError errors={[errors?.start_time]} />
        </Field>
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Gathering time')}
          </FieldLabel>
          <Input
            type="time"
            max={schedule[0]?.[0]?.end_time || days[0]?.end_time || undefined}
            {...register('schedule.0.0.gather_time', rules.gather(0, 0))}
            className={inputClassName}
          />
          <FieldError errors={[errors?.gather_time]} />
        </Field>
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Person in charge')} <span className="text-destructive">*</span>
            <InfoTooltip
              content={t(
                "Only the campaign's managers and the organization's owners can lead a shift. Add managers on the campaign page.",
              )}
            />
          </FieldLabel>
          <ShiftLeaderSelect d={0} p={0} members={members} />
          <FieldError errors={[errors?.leader_user_id]} />
        </Field>
      </div>
      <FieldError errors={dayMessages[0].map((message) => ({ message }))} />
    </>
  );
}
