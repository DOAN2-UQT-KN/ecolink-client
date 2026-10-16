import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIncident } from '../_hooks/useIncident';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { MultiSelect } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Controller, useWatch } from 'react-hook-form';
import { cn } from '@/libs/utils';
import { REPORT_CATEGORIES, WASTE_TYPES } from '@/constants/reportVerification';
import { useDebounce } from '@/hooks/useDebounce';
import { useGetReportContext } from '@/apis/incident/getReportContext';
import { contextPointKey, orderCategories } from '../_services/category.service';
import CategorySelect from './CategorySelect';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  SEVERITY_LEVEL,
  SEVERITY_MAX,
  SEVERITY_MIN,
  getSeverityLevel,
} from '@/constants/severity';

const conditionOptions = [
  { label: 'Newly-appeared', value: 'newly-appeared' },
  { label: 'Long-standing', value: 'long-standing' },
  { label: 'Previously cleaned but reappeared', value: 'reappeared' },
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

  // Suggestions only reorder the list and never pick a category for the user (specs/007 US5).
  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] });
  const pointKey = useDebounce(contextPointKey(latitude, longitude), 500);
  const [lat, lng] = pointKey ? pointKey.split(',').map(Number) : [];
  const { data: contextData } = useGetReportContext(pointKey ? { lat, lng } : null);
  const categoryOptions = useMemo(
    () =>
      orderCategories(REPORT_CATEGORIES, contextData?.data?.suggestions).map((c) => ({
        value: c.value,
        label: c.label,
        hint: c.hint
          ? c.hint.distanceM != null
            ? t('Suitable for this location · {{name}}, {{distance}} m', {
                name: c.hint.name,
                distance: Math.round(c.hint.distanceM),
              })
            : t('Suitable for this location · {{name}}', { name: c.hint.name })
          : undefined,
      })),
    [contextData, t],
  );

  const inputClassName =
    'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

  const translatedWasteTypeOptions = useMemo(
    () =>
      WASTE_TYPES.map((o) => ({
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

        <CategorySelect options={categoryOptions} triggerClassName={inputClassName} />

        {/* Waste Type — multi-select */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Waste type')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="wasteTypes"
            control={control}
            defaultValue={[]}
            rules={{ validate: (v) => v.length > 0 || t('Choose at least one waste type') }}
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
          <FieldError errors={[errors.wasteTypes]} />
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

        {/* Severity — slider 1–5 */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Severity')}
          </FieldLabel>
          <Controller
            name="severityLevel"
            control={control}
            render={({ field }) => {
              const level = field.value ?? SEVERITY_MIN;
              const severity = getSeverityLevel(level) ?? SEVERITY_LEVEL[SEVERITY_MIN];
              return (
                <div className="flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.5)] bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-center text-sm">
                    <span className={cn('font-semibold text-center', severity.textClass)}>
                    {t(severity.label)}
                    </span>
                  </div>
                  <Slider
                    min={SEVERITY_MIN}
                    max={SEVERITY_MAX}
                    step={1}
                    value={[level]}
                    onValueChange={(value) => field.onChange(value[0] ?? SEVERITY_MIN)}
                    aria-label={t('Severity')}
                    className={severity.sliderClass}
                  />
                  <div className="flex justify-between px-0.5">
                    {([1, 2, 3, 4, 5] as const).map((value) => {
                      const item = SEVERITY_LEVEL[value];
                      const selected = value === level;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={cn(
                            'flex flex-col items-center gap-0.5 text-[10px] transition-colors',
                            selected
                              ? cn('font-semibold', item.textClass)
                              : 'text-foreground-tertiary',
                          )}
                        >
                          {/* <span>{value}</span> */}
                          <span className="hidden sm:block">{t(item.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
        </Field>
      </div>
    ),
    [categoryOptions, control, errors.wasteTypes, inputClassName, t, translatedConditionOptions, translatedWasteTypeOptions],
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
