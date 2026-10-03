import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { BiTrash } from 'react-icons/bi';

import { Calendar } from '@/components/ui/calendar';
import { Button as UiButton } from '@/components/ui/button';
import { Button } from '@/components/client/shared/Button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/libs/utils';
import {
  CAMPAIGN_DAY_MAX,
  CAMPAIGN_DAY_SPAN_DAYS,
  CAMPAIGN_MAX_HOURS_PER_DAY,
  CAMPAIGN_MIN_LEAD_HOURS,
} from '@/constants/campaignLifecycle';

import { useCampaign } from '../_hooks/useCampaign';
import { combineDateTime, emptyDay, type CampaignDayFormValues } from '../_services/campaign.service';
import NeedsReviewTag from './NeedsReviewTag';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

const formatDateToApi = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseApiDate = (date?: string): Date | undefined => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const minutesOf = (time?: string): number | null => {
  const m = time?.match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Earliest picked date of the campaign, or undefined while none is picked. */
const firstDate = (days: CampaignDayFormValues[]): Date | undefined =>
  days
    .map((d) => parseApiDate(d.date))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime())[0];

/**
 * The campaign days (1–7, within 14 days of the first, not necessarily consecutive), each
 * with its own start and end time.
 */
const ScheduleFields = memo(function ScheduleFields() {
  const { t } = useTranslation();
  const { form, addScheduleRow, removeScheduleRow, approvedEdit, savedCampaign } = useCampaign();
  /**
   * An existing day of an approved campaign still at its saved times: the creation rules do not
   * apply to it (it may well be close by now). New times are an important change (3.5).
   */
  const isUntouched = useCallback(
    (day?: CampaignDayFormValues) => {
      if (!approvedEdit || !day?.server_id) return false;
      const stored = savedCampaign?.days?.find((d) => d.id === day.server_id);
      if (!stored) return false;
      const same = (a: string | undefined, b: string) =>
        a != null && new Date(a).getTime() === new Date(b).getTime();
      return (
        same(combineDateTime(day.date, day.start_time), stored.start_at) &&
        same(combineDateTime(day.date, day.end_time), stored.end_at)
      );
    },
    [approvedEdit, savedCampaign],
  );
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'days' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const days = watch('days');
  const first = firstDate(days);

  useEffect(() => {
    fields.forEach((_, index) =>
      register(`days.${index}.date`, {
        validate: (value, values) => {
          if (isUntouched(values.days[index])) return true;
          if (!value) return t('Pick the campaign day');
          const others = values.days.filter((_, i) => i !== index).map((d) => d.date);
          if (others.includes(value)) return t('Each day can be added only once');
          const earliest = firstDate(values.days);
          const date = parseApiDate(value);
          if (earliest && date && date.getTime() - earliest.getTime() > (CAMPAIGN_DAY_SPAN_DAYS - 1) * 86_400_000) {
            return t('Every day must fall within {{n}} days of the first one', {
              n: CAMPAIGN_DAY_SPAN_DAYS,
            });
          }
          if (earliest && date && date.getTime() === earliest.getTime()) {
            const start = new Date(`${value}T${values.days[index].start_time || '00:00'}:00`);
            if (start.getTime() < Date.now() + CAMPAIGN_MIN_LEAD_HOURS * 3_600_000) {
              return t('The first day must start at least {{hours}} hours from now', {
                hours: CAMPAIGN_MIN_LEAD_HOURS,
              });
            }
          }
          return true;
        },
      }),
    );
  }, [fields, isUntouched, register, t]);

  const minDay = useMemo(() => new Date(Date.now() + CAMPAIGN_MIN_LEAD_HOURS * 3_600_000), []);
  const dayErrors = errors.days;

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {t('Campaign schedule')}
          </span>
          <NeedsReviewTag />
          <InfoTooltip
            content={t(
              '1–{{max}} days within {{span}} days of the first, not necessarily in a row. The first day starts at least {{hours}} hours from now; each day lasts at most {{perDay}} hours.',
              {
                max: CAMPAIGN_DAY_MAX,
                span: CAMPAIGN_DAY_SPAN_DAYS,
                hours: CAMPAIGN_MIN_LEAD_HOURS,
                perDay: CAMPAIGN_MAX_HOURS_PER_DAY,
              },
            )}
          />
        </div>
        {fields.length < CAMPAIGN_DAY_MAX && (
          <Button
            type="button"
            variant="outlined-brown"
            onClick={() => {
              const last = days[days.length - 1];
              append({ ...emptyDay(), start_time: last?.start_time ?? '07:00', end_time: last?.end_time ?? '11:00' });
              addScheduleRow();
            }}
          >
            {t('Add day')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const value = days[index];
          const errs = dayErrors?.[index];
          return (
            <Field key={field.id}>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Day {{n}}', { n: index + 1 })} <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-3 items-start">
                <div className="relative">
                  <UiButton
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-[rgba(136,122,71,0.5)] hover:bg-transparent !h-[50px]',
                      !value?.date && 'text-muted-foreground',
                    )}
                    onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.date ? (
                      format(parseApiDate(value.date) as Date, 'PPP')
                    ) : (
                      <span>{t('Pick the campaign day')}</span>
                    )}
                  </UiButton>
                  {openIndex === index && (
                    <div className="absolute z-50 mt-2 rounded-md border border-[rgba(136,122,71,0.5)] bg-background shadow-md">
                      <Calendar
                        mode="single"
                        defaultMonth={parseApiDate(value?.date) ?? first ?? new Date()}
                        selected={parseApiDate(value?.date)}
                        disabled={[
                          { before: minDay },
                          // Other days must stay within the span of the first one.
                          ...(first && fields.length > 1
                            ? [{ after: addDays(first, CAMPAIGN_DAY_SPAN_DAYS - 1) }]
                            : []),
                        ]}
                        onSelect={(date: Date | undefined) => {
                          form.setValue(`days.${index}.date`, formatDateToApi(date), {
                            shouldDirty: true,
                          });
                          setOpenIndex(null);
                          void form.trigger('days');
                        }}
                      />
                    </div>
                  )}
                </div>
                <Input
                  type="time"
                  aria-label={t('Start time')}
                  className={inputClassName}
                  {...register(`days.${index}.start_time`, {
                    required: t('Start time is required'),
                  })}
                />
                <Input
                  type="time"
                  aria-label={t('End time')}
                  className={inputClassName}
                  {...register(`days.${index}.end_time`, {
                    required: t('End time is required'),
                    validate: (end, values) => {
                      if (isUntouched(values.days[index])) return true;
                      const a = minutesOf(values.days[index]?.start_time);
                      const b = minutesOf(end);
                      if (a == null || b == null) return true;
                      if (b <= a) return t('End time must be after the start time');
                      if (b - a > CAMPAIGN_MAX_HOURS_PER_DAY * 60) {
                        return t('A campaign day lasts at most {{max}} hours', {
                          max: CAMPAIGN_MAX_HOURS_PER_DAY,
                        });
                      }
                      return true;
                    },
                  })}
                />
                {fields.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t('Remove day')}
                    className="h-[50px] px-2 text-destructive"
                    onClick={() => {
                      remove(index);
                      removeScheduleRow(index);
                    }}
                  >
                    <BiTrash size={18} />
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <FieldError errors={[errs?.date]} />
              <FieldError errors={[errs?.start_time]} />
              <FieldError errors={[errs?.end_time]} />
            </Field>
          );
        })}
        {/* "days" itself: e.g. the server says the campaign needs at least one day. */}
        <FieldError
          errors={[dayErrors?.root, { message: (dayErrors as { message?: string } | undefined)?.message }]}
        />
      </div>
    </div>
  );
});

export default ScheduleFields;
