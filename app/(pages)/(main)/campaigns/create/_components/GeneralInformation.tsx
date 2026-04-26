'use client';

import { memo, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/libs/utils';
import SelectListOrganization from '@/components/form/SelectListOrganization';

import { useCampaign } from '../_hooks/useCampaign';
import { difficultyOptions } from '../_services/campaign.service';
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
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const GeneralInformation = memo(function GeneralInformation({
  organizationId,
}: {
  organizationId?: string;
}) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  const difficultyMin = difficultyOptions[0] ?? 1;
  const difficultyMax = difficultyOptions[difficultyOptions.length - 1] ?? 5;

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
                  disabled={Boolean(organizationId)}
                />
              )}
            />
            <FieldError errors={[errors.organization_id]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Title')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...register('title', { required: t('Title is required') })}
              placeholder={t('Enter campaign title...')}
              className={inputClassName}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Campaign schedule')}
            </FieldLabel>
            <Controller
              name="end_date"
              control={control}
              render={() => (
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-[rgba(136,122,71,0.5)] hover:bg-transparent !h-[50px]',
                      !startDateValue && 'text-muted-foreground',
                    )}
                    onClick={() => setIsDateRangeOpen((prev) => !prev)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDateValue && endDateValue ? (
                      `${format(parseApiDate(startDateValue) as Date, 'PPP')} - ${format(parseApiDate(endDateValue) as Date, 'PPP')}`
                    ) : (
                      <span>{t('Pick a date range')}</span>
                    )}
                  </Button>
                  {isDateRangeOpen && (
                    <div className="absolute z-50 mt-2 rounded-md border border-[rgba(136,122,71,0.5)] bg-background shadow-md">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        defaultMonth={parseApiDate(startDateValue) ?? new Date()}
                        selected={{
                          from: parseApiDate(startDateValue),
                          to: parseApiDate(endDateValue),
                        }}
                        onSelect={(range: DateRange | undefined) => {
                          form.setValue('start_date', formatDateToApi(range?.from), {
                            shouldDirty: true,
                          });
                          form.setValue('end_date', formatDateToApi(range?.to), {
                            shouldDirty: true,
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            />
            <FieldError errors={[errors.start_date]} />
            <FieldError errors={[errors.end_date]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Difficulty')}
            </FieldLabel>
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.5)] bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-foreground-tertiary">
                    <span>{t('Level')}</span>
                    <span className="font-medium text-foreground">
                      {field.value ?? difficultyMin}
                    </span>
                  </div>
                  <Slider
                    min={difficultyMin}
                    max={difficultyMax}
                    step={1}
                    value={[field.value ?? difficultyMin]}
                    onValueChange={(value) => field.onChange(value[0] ?? difficultyMin)}
                    aria-label={t('Difficulty')}
                    className="[&_[data-slot=slider-range]]:bg-button-accent [&_[data-slot=slider-thumb]]:border-button-accent"
                  />
                </div>
              )}
            />
            <FieldError errors={[errors.difficulty]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Description')}
            </FieldLabel>
            {/* <Textarea
              {...register('description')}
              placeholder={t('Describe this campaign...')}
              className={cn(inputClassName, 'min-h-[220px]')}
              rows={4}
            /> */}
            <RichTextEditor
              value={watch('description')}
              onChange={(value) => form.setValue('description', value)}
              placeholder={t('Describe this campaign...')}
              className={cn(inputClassName, 'min-h-[220px]')}
            />
            {/* <FieldError errors={[errors.description]} /> */}
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Banner')}
            </FieldLabel>
            <UploadBanner />
          </Field>
        </div>
      </div>
    </div>
  );
});

export default GeneralInformation;
