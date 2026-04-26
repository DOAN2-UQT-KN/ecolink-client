'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIncident } from '../_hooks/useIncident';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { MultiSelect } from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import { cn } from '@/libs/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';

const wasteTypeOptions = [
  { label: 'Household waste', value: 'household' },
  { label: 'Construction waste', value: 'construction' },
  { label: 'Industrial waste', value: 'industrial' },
  { label: 'Hazardous waste', value: 'hazardous' },
];

const conditionOptions = [
  { label: 'Newly-appeared', value: 'newly-appeared' },
  { label: 'Long-standing', value: 'long-standing' },
  { label: 'Previously cleaned but reappeared', value: 'reappeared' },
];

const pollutionLevelOptions = [
  { label: 'Odor present / No odor', value: 'odor' },
  { label: 'Leachate present / No leachate', value: 'leachate' },
  { label: 'Smoke or fire present / No smoke or fire', value: 'smoke-fire' },
];

const sizeOptions = [
  { label: 'Small', value: '1' },
  { label: 'Medium', value: '2' },
  { label: 'Large', value: '3' },
];

const Information = memo(function Information() {
  const { t } = useTranslation();
  const { form, onSubmit, isPending } = useIncident();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const inputClassName =
    'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

  const translatedWasteTypeOptions = useMemo(
    () =>
      wasteTypeOptions.map((o) => ({
        ...o,
        label: t(o.label),
      })),
    [t],
  );

  const translatedConditionOptions = useMemo(
    () =>
      conditionOptions.map((o) => ({
        ...o,
        label: t(o.label),
      })),
    [t],
  );

  const translatedPollutionLevelOptions = useMemo(
    () =>
      pollutionLevelOptions.map((o) => ({
        ...o,
        label: t(o.label),
      })),
    [t],
  );

  const translatedSizeOptions = useMemo(
    () =>
      sizeOptions.map((o) => ({
        ...o,
        label: t(o.label),
      })),
    [t],
  );

  const generalInformation = useMemo(
    () => (
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('General Information')}
        </span>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Title')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('title', { required: t('Title is required') })}
            placeholder={t('Enter title...')}
            className={inputClassName}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Description')}
          </FieldLabel>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder={t('Enter description...')}
                className={cn(
                  inputClassName,
                  'min-h-[220px]',
                  isPending && 'pointer-events-none opacity-60',
                )}
              />
            )}
          />
          <FieldError errors={[errors.description]} />
        </Field>
      </div>
    ),
    [control, errors.description, errors.title, inputClassName, isPending, register, t],
  );

  const detailInformation = useMemo(
    () => (
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('Detail Information')}
        </span>

        {/* Waste Type — multi-select */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Waste type')}
          </FieldLabel>
          <Controller
            name="wasteTypes"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelect
                options={translatedWasteTypeOptions}
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder={t('Select waste type...')}
                triggerClassName="border-[rgba(136,122,71,0.5)] focus-visible:ring-[rgba(136,122,71,0.5)]/50 w-full"
              />
            )}
          />
        </Field>

        {/* Condition — single-select radio */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Condition')}
          </FieldLabel>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-col gap-1"
              >
                {translatedConditionOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`condition-${option.value}`}
                    className={cn(
                      'flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all cursor-pointer',
                      field.value === option.value
                        ? 'bg-button-accent/10 border-button-accent'
                        : 'bg-white/5 border-white/10 hover:border-white/20',
                    )}
                  >
                    <RadioGroupItem value={option.value} id={`condition-${option.value}`} />
                    <span className="text-sm font-normal flex-1">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </Field>

        {/* Pollution Level — multi-select */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Pollution level')}
          </FieldLabel>
          <Controller
            name="pollutionLevels"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelect
                options={translatedPollutionLevelOptions}
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder={t('Select pollution level...')}
                triggerClassName="border-[rgba(136,122,71,0.5)] focus-visible:ring-[rgba(136,122,71,0.5)]/50 w-full"
              />
            )}
          />
        </Field>

        {/* Size — single-select radio */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">{t('Size')}</FieldLabel>
          <Controller
            name="size"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-row gap-4"
              >
                {translatedSizeOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`size-${option.value}`}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer flex-1 justify-center',
                      field.value === option.value
                        ? 'bg-button-accent/10 border-button-accent'
                        : 'bg-white/5 border-white/10 hover:border-white/20',
                    )}
                  >
                    <RadioGroupItem value={option.value} id={`size-${option.value}`} />
                    <span className="text-sm font-normal flex-1">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </Field>
      </div>
    ),
    [
      control,
      t,
      translatedConditionOptions,
      translatedPollutionLevelOptions,
      translatedSizeOptions,
      translatedWasteTypeOptions,
    ],
  );

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {generalInformation}
        {detailInformation}
      </form>
    </div>
  );
});

export default Information;
