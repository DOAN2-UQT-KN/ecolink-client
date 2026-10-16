import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REPORT_CATEGORIES } from '@/constants/reportVerification';
import type { ReportCategory } from '@/apis/incident/models/verification';
import { cn } from '@/libs/utils';
import { IncidentFormValues } from '../_services/incident.service';

export interface CategoryOption {
  value: ReportCategory;
  /** Untranslated label key. */
  label: string;
  /** Already translated second line, e.g. why it fits the pinned location. */
  hint?: string;
}

export default function CategorySelect({
  options = REPORT_CATEGORIES,
  triggerClassName,
}: {
  options?: CategoryOption[];
  triggerClassName?: string;
}) {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();

  return (
    <Field id="report-category">
      <FieldLabel className="text-foreground-tertiary font-display-3">
        {t('Report type')} <span className="text-destructive">*</span>
      </FieldLabel>
      <Controller
        name="category"
        control={control}
        rules={{ required: t('Report type is required') }}
        render={({ field }) => (
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SelectTrigger className={cn('w-full', triggerClassName)} aria-invalid={!!errors.category}>
              <SelectValue placeholder={t('Select a report type...')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex flex-col items-start">
                    <span className="text-sm">{t(o.label)}</span>
                    {o.hint && <span className="text-xs text-foreground-tertiary">{o.hint}</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError errors={[errors.category]} />
    </Field>
  );
}
