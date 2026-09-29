import { memo, useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/libs/utils';
import SelectListOrganization from '@/components/form/SelectListOrganization';
import { CAMPAIGN_CREATOR_ROLES } from '@/hooks/useCampaignCreatorOrganizations';

import { useCampaign } from '../_hooks/useCampaign';
import { TITLE_MAX_LENGTH } from '../_services/campaign.service';
import {
  CAMPAIGN_DESCRIPTION_MIN_LENGTH,
  CAMPAIGN_MAX_HOURS_PER_DAY,
  CAMPAIGN_MIN_LEAD_HOURS,
  CAMPAIGN_TITLE_MIN_LENGTH,
  stripHtml,
} from '@/constants/campaignLifecycle';
import {
  DIFFICULTY_LEVEL,
  DIFFICULTY_MAX,
  DIFFICULTY_MIN,
  DIFFICULTY_VALUES,
  getDifficultyLevel,
} from '@/constants/difficulty';
import UploadBanner from './UploadBanner';
import RichTextEditor from '@/components/ui/RichTextEditor';

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

const GeneralInformation = memo(function GeneralInformation() {
  const { t } = useTranslation();
  const { form, eligibility, campaign } = useCampaign();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const [isDateOpen, setIsDateOpen] = useState(false);

  const campaignDate = watch('campaign_date');
  const maxDifficulty = eligibility?.max_difficulty ?? null;
  const isUnverified = eligibility != null && !eligibility.is_verified;

  // Rules checked on "Send for review"; a draft may be saved half-filled.
  useEffect(() => {
    register('banner', { validate: (v) => Boolean(v) || t('A cover image is required') });
    register('description', {
      validate: (v) =>
        stripHtml(v).length >= CAMPAIGN_DESCRIPTION_MIN_LENGTH ||
        t('Description must be at least {{min}} characters', {
          min: CAMPAIGN_DESCRIPTION_MIN_LENGTH,
        }),
    });
    register('campaign_date', { required: t('Pick the campaign day') });
  }, [register, t]);

  // An unverified organization only gets the lowest difficulty.
  useEffect(() => {
    if (maxDifficulty != null && form.getValues('difficulty') > maxDifficulty) {
      form.setValue('difficulty', maxDifficulty);
    }
  }, [form, maxDifficulty]);
  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('General Information')}
        </span>

        <div className="grid grid-cols-2 gap-[30px]">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Organization')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="organization_id"
              control={control}
              rules={{ required: t('Organization is required') }}
              render={({ field }) => (
                <SelectListOrganization
                  value={field.value}
                  onChange={field.onChange}
                  roles={CAMPAIGN_CREATOR_ROLES}
                  disabled={Boolean(campaign)}
                />
              )}
            />
            {isUnverified && (
              <span className="text-xs font-medium text-amber-700">
                {t('Unverified organization')}: {t('lowest difficulty only, at most 2 campaigns running at a time')}
              </span>
            )}
            <FieldError errors={[errors.organization_id]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Title')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...register('title', {
                required: t('Title is required'),
                minLength: {
                  value: CAMPAIGN_TITLE_MIN_LENGTH,
                  message: t('Title must be at least {{min}} characters', {
                    min: CAMPAIGN_TITLE_MIN_LENGTH,
                  }),
                },
                maxLength: {
                  value: TITLE_MAX_LENGTH,
                  message: t('Title must be at most {{max}} characters', {
                    max: TITLE_MAX_LENGTH,
                  }),
                },
              })}
              maxLength={TITLE_MAX_LENGTH}
              placeholder={t('Enter campaign title...')}
              className={inputClassName}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Campaign schedule')} <span className="text-destructive">*</span>
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
            <span className="text-xs text-foreground-tertiary">
              {t('Starts at least {{hours}} hours from now, lasts at most {{max}} hours on one day', {
                hours: CAMPAIGN_MIN_LEAD_HOURS,
                max: CAMPAIGN_MAX_HOURS_PER_DAY,
              })}
            </span>
            <FieldError errors={[errors.campaign_date]} />
            <FieldError errors={[errors.start_time]} />
            <FieldError errors={[errors.end_time]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Difficulty')}
            </FieldLabel>
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => {
                const level = field.value ?? DIFFICULTY_MIN;
                const difficulty =
                  getDifficultyLevel(level) ?? DIFFICULTY_LEVEL[DIFFICULTY_MIN];
                return (
                  <div className="flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.5)] bg-white/5 px-4 py-3">
                    <div className="flex items-center justify-center text-sm">
                      <span className={cn('font-semibold text-center', difficulty.textClass)}>
                        {t(difficulty.label)}
                      </span>
                    </div>
                    <Slider
                      min={DIFFICULTY_MIN}
                      max={maxDifficulty ?? DIFFICULTY_MAX}
                      disabled={maxDifficulty === DIFFICULTY_MIN}
                      step={1}
                      value={[level]}
                      onValueChange={(value) => field.onChange(value[0] ?? DIFFICULTY_MIN)}
                      aria-label={t('Difficulty')}
                      className={difficulty.sliderClass}
                    />
                    <div className="flex justify-between px-0.5">
                      {DIFFICULTY_VALUES.map((value) => {
                        const item = DIFFICULTY_LEVEL[value];
                        const selected = value === level;
                        const allowed = maxDifficulty == null || value <= maxDifficulty;
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={!allowed}
                            onClick={() => field.onChange(value)}
                            className={cn(
                              'flex flex-col items-center gap-0.5 text-[10px] transition-colors',
                              selected
                                ? cn('font-semibold', item.textClass)
                                : 'text-foreground-tertiary',
                              !allowed && 'opacity-40 cursor-not-allowed',
                            )}
                          >
                            <span className="hidden sm:block">{t(item.label)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            <FieldError errors={[errors.difficulty]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Description')} <span className="text-destructive">*</span>
            </FieldLabel>
            {/* <Textarea
              {...register('description')}
              placeholder={t('Describe this campaign...')}
              className={cn(inputClassName, 'min-h-[220px]')}
              rows={4}
            /> */}
            <RichTextEditor
              value={watch('description')}
              onChange={(value) => form.setValue('description', value, { shouldDirty: true })}
              placeholder={t('Describe this campaign...')}
              className={cn(inputClassName, 'min-h-[220px]')}
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Banner')} <span className="text-destructive">*</span>
            </FieldLabel>
            <UploadBanner />
            <FieldError errors={[errors.banner]} />
          </Field>

        </div>
      </div>
    </div>
  );
});

export default GeneralInformation;
