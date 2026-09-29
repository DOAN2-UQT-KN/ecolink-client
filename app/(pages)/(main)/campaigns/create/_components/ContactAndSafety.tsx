import { memo, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

import { useCampaign } from '../_hooks/useCampaign';
import { impliedMinAge } from '../_services/campaign.service';

/** 0xxxxxxxxx or +84xxxxxxxxx, spaces/dots/dashes allowed (same rule as the server). */
const VN_PHONE_RE = /^(?:\+84|0)\d{9}$/;

const ContactAndSafety = memo(function ContactAndSafety() {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const difficulty = watch('difficulty');
  const defaultMinAge = impliedMinAge(difficulty);

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <span className="font-display-5 font-semibold !text-button-accent ">
        {t('Contact and safety')}
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Contact person')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('contact_name', { required: t('Contact name is required') })}
            maxLength={120}
            placeholder={t('Full name')}
            className={inputClassName}
          />
          <FieldError errors={[errors.contact_name]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Contact phone')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('contact_phone', {
              required: t('Enter a valid phone number'),
              validate: (v) =>
                VN_PHONE_RE.test(v.replace(/[\s.-]/g, '')) || t('Enter a valid phone number'),
            })}
            maxLength={20}
            inputMode="tel"
            placeholder="0901 234 567"
            className={inputClassName}
          />
          <span className="text-xs text-foreground-tertiary">
            {t('Only shown to accepted volunteers')}
          </span>
          <FieldError errors={[errors.contact_phone]} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Safety notes')}
          </FieldLabel>
          <Textarea
            {...register('safety_notes')}
            rows={3}
            placeholder={t('Tools, clothing, risks volunteers should know about...')}
            className={inputClassName}
          />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Minimum age')}
          </FieldLabel>
          <Input
            type="number"
            min={0}
            max={100}
            {...register('min_age', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              validate: (v) =>
                v == null || (Number.isInteger(v) && v >= 0 && v <= 100) ||
                t('Minimum age must be 0–100'),
            })}
            placeholder={defaultMinAge ? String(defaultMinAge) : t('No limit')}
            className={inputClassName}
          />
          {defaultMinAge != null && (
            <span className="text-xs text-foreground-tertiary">
              {t('Hard campaigns require volunteers aged {{age}}+ by default', {
                age: defaultMinAge,
              })}
            </span>
          )}
          <FieldError errors={[errors.min_age]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Required skills')}
          </FieldLabel>
          <Input
            {...register('skills')}
            placeholder={t('e.g. Swimming, First aid')}
            className={inputClassName}
          />
        </Field>

        <Controller
          name="bring_own_tools"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              {t('Volunteers bring their own tools')}
            </label>
          )}
        />
      </div>
    </div>
  );
});

export default ContactAndSafety;
