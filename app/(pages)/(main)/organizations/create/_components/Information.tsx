'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '../_hooks/useOrganization';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { OrganizationImageField } from './OrganizationImageUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/libs/utils';

export const Information = memo(function Information() {
  const { t } = useTranslation();
  const { form, onSubmit } = useOrganization();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  const generalInformation = useMemo(
    () => (
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('General Information')}
        </span>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Name')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('name', { required: t('Name is required') })}
            placeholder={t('Enter organization name...')}
            className={inputClassName}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Description')}
          </FieldLabel>
          <RichTextEditor
            value={watch('description')}
            onChange={(value) => setValue('description', value)}
            placeholder={t('Enter description...')}
            className={cn(inputClassName, 'min-h-[220px]')}
          />
        </Field>
      </div>
    ),
    [errors.description, errors.name, inputClassName, register, t],
  );

  const brandAndContact = useMemo(
    () => (
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('Brand & contact')}
        </span>

        <OrganizationImageField
          name="logoUrl"
          control={control}
          label={t('Logo')}
          error={errors.logoUrl}
          cropAspect={1}
          required
          requiredMessage={t('Logo is required')}
        />

        <OrganizationImageField
          name="backgroundUrl"
          control={control}
          label={t('Background')}
          error={errors.backgroundUrl}
          cropAspect={16 / 9}
          required
          requiredMessage={t('Background is required')}
        />

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t('Contact email')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="email"
            {...register('contactEmail', {
              required: t('Contact email is required'),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t('Invalid email address'),
              },
            })}
            placeholder={t('contact@example.com')}
            className={inputClassName}
          />
          <FieldError errors={[errors.contactEmail]} />
        </Field>
      </div>
    ),
    [
      control,
      errors.backgroundUrl,
      errors.contactEmail,
      errors.logoUrl,
      inputClassName,
      register,
      t,
    ],
  );

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {generalInformation}
        {brandAndContact}
      </form>
    </div>
  );
});

export default Information;
