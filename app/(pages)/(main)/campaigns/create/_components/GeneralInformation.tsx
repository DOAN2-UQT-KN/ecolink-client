import { memo, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/libs/utils';
import Image from '@/components/ui/AppImage';

import { useCampaign } from '../_hooks/useCampaign';
import { TITLE_MAX_LENGTH } from '../_services/campaign.service';
import {
  CAMPAIGN_DESCRIPTION_MIN_LENGTH,
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

const GeneralInformation = memo(function GeneralInformation() {
  const { t } = useTranslation();
  const { form, eligibility, organization } = useCampaign();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
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

        <div className="grid grid-cols-2 items-start gap-[30px]">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Organization')}
            </FieldLabel>
            {/* Fixed: the campaign is created from this organization's page. */}
            <div className="flex h-[50px] items-center gap-3 rounded-md border border-[rgba(136,122,71,0.5)] bg-muted/40 px-3">
              {organization?.logo_url && (
                <Image
                  src={organization.logo_url}
                  alt={organization.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              )}
              <span className="truncate text-sm font-medium">{organization?.name ?? '—'}</span>
            </div>
            {isUnverified && (
              <span className="text-xs font-medium text-amber-700">
                {t('Unverified organization')}: {t('lowest difficulty only, at most 2 campaigns running at a time')}
              </span>
            )}
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

          <Field className="col-span-2">
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
              {t('Banner')} <span className="text-destructive">*</span>
            </FieldLabel>
            <UploadBanner />
            <FieldError errors={[errors.banner]} />
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

        </div>
      </div>
    </div>
  );
});

export default GeneralInformation;
