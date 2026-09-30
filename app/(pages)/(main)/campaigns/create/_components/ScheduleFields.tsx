import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/libs/utils';
import {
  CAMPAIGN_MAX_HOURS_PER_DAY,
  CAMPAIGN_MIN_LEAD_HOURS,
} from '@/constants/campaignLifecycle';

import { useCampaign } from '../_hooks/useCampaign';

const formatDateToApi = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseApiDate = (date?: string): Date | undefined => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const minutesOf = (time?: string): number | null => {
  const m = time?.match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Campaign day and start/end time (one day, at most 12 hours). */
const ScheduleFields = memo(function ScheduleFields() {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const [isDateOpen, setIsDateOpen] = useState(false);
  const campaignDate = watch('campaign_date');

  useEffect(() => {
    register('campaign_date', { required: t('Pick the campaign day') });
  }, [register, t]);

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <span className="font-display-5 font-semibold !text-button-accent ">
        {t('Time')}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
          <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Campaign schedule')} <span className="text-destructive">*</span>
            <InfoTooltip
              content={t('Starts at least {{hours}} hours from now, lasts at most {{max}} hours on one day', {
                hours: CAMPAIGN_MIN_LEAD_HOURS,
                max: CAMPAIGN_MAX_HOURS_PER_DAY,
              })}
            />
          </FieldLabel>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal border-[rgba(136,122,71,0.5)] hover:bg-transparent !h-[50px]',
                !campaignDate && 'text-muted-foreground',
              )}
              onClick={() => setIsDateOpen((prev) => !prev)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {campaignDate ? (
                format(parseApiDate(campaignDate) as Date, 'PPP')
              ) : (
                <span>{t('Pick the campaign day')}</span>
              )}
            </Button>
            {isDateOpen && (
              <div className="absolute z-50 mt-2 rounded-md border border-[rgba(136,122,71,0.5)] bg-background shadow-md">
                <Calendar
                  mode="single"
                  defaultMonth={parseApiDate(campaignDate) ?? new Date()}
                  selected={parseApiDate(campaignDate)}
                  disabled={{ before: new Date(Date.now() + CAMPAIGN_MIN_LEAD_HOURS * 3600_000) }}
                  onSelect={(date: Date | undefined) => {
                    form.setValue('campaign_date', formatDateToApi(date), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setIsDateOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="time"
              aria-label={t('Start time')}
              className={inputClassName}
              {...register('start_time', { required: t('Start time is required') })}
            />
            <Input
              type="time"
              aria-label={t('End time')}
              className={inputClassName}
              {...register('end_time', {
                required: t('End time is required'),
                validate: (end, values) => {
                  const a = minutesOf(values.start_time);
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
          </div>
          <FieldError errors={[errors.campaign_date]} />
          <FieldError errors={[errors.start_time]} />
          <FieldError errors={[errors.end_time]} />
        </Field>
      </div>
    </div>
  );
});

export default ScheduleFields;
