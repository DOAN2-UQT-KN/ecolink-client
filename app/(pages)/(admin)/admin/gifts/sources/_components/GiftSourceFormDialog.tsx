import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { getGiftSources } from '@/apis/gift-source/getGiftSources';
import { useCreateGiftSource } from '@/apis/gift-source/createGiftSource';
import { useUpdateGiftSource } from '@/apis/gift-source/updateGiftSource';
import type { IGiftSource } from '@/apis/gift-source/models/giftSource';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { SingleImageFileField } from '@/components/client/shared/SingleImageFileField';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { uploadToCloudinary } from '@/libs/cloudinary';
import { isBlobLike } from '@/libs/useImagePreviewSrc';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import {
  DEFAULT_GIFT_SOURCE_FORM_VALUES,
  EMAIL_PATTERN,
  GIFT_SOURCE_TYPE_LABEL,
  GIFT_SOURCE_TYPES,
  PHONE_PATTERN,
  sourceToFormValues,
  toGiftSourceBody,
  type GiftSourceFormValues,
} from '../_services/giftSourceForm.service';

type Props = {
  source?: IGiftSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FORM_FIELDS = ['name', 'type', 'contactName', 'contactPhone', 'contactEmail', 'note'] as const;

/** Create (no `source`) or edit a gift source. */
export function GiftSourceFormDialog({ source, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const isEdit = Boolean(source);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);

  const form = useForm<GiftSourceFormValues>({ defaultValues: DEFAULT_GIFT_SOURCE_FORM_VALUES });
  const {
    register,
    control,
    reset,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const createMutation = useCreateGiftSource({ onSuccess: () => onOpenChange(false) });
  const updateMutation = useUpdateGiftSource({ onSuccess: () => onOpenChange(false) });
  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setDuplicateName(null);
    reset(source ? sourceToFormValues(source) : DEFAULT_GIFT_SOURCE_FORM_VALUES);
  }, [open, source, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const name = values.name.trim();
    // Same name is allowed, but warn once before creating it (spec 015 Edge Cases).
    if (!isEdit && duplicateName !== name) {
      const found = await getGiftSources({ search: name, limit: 20 }).catch(() => null);
      if (found?.data.sources.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) {
        setDuplicateName(name);
        return;
      }
    }

    let logoUrl: string | null = null;
    if (isBlobLike(values.logo)) {
      try {
        logoUrl = await uploadToCloudinary(values.logo);
      } catch (err) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: (err instanceof Error && err.message) || t('Failed to upload image'),
        });
        return;
      }
    }

    const body = toGiftSourceBody(values, logoUrl);
    try {
      if (source) await updateMutation.mutateAsync({ id: source.id, data: body });
      else await createMutation.mutateAsync(body);
    } catch (error) {
      // usePost shows the toast; also mark the fields the server rejected.
      for (const e of fieldErrorsFromApi(error)) {
        const field = FORM_FIELDS.find((f) => f === e.field);
        if (field) setError(field, { message: e.message });
      }
    }
  });

  const errorText = (field: (typeof FORM_FIELDS)[number]) =>
    errors[field] ? <span className="text-sm text-red-500">{errors[field]?.message}</span> : null;

  const inputClass = 'h-10 !border !border-zinc-300';

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        className={cn('max-h-[90vh] max-w-lg gap-4 overflow-x-hidden overflow-y-auto', isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold">
            {isEdit ? t('Edit gift source') : t('Create gift source')}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field>
            <FieldLabel htmlFor="source-name">{t('Name')}</FieldLabel>
            <Input
              id="source-name"
              className={inputClass}
              disabled={busy}
              aria-invalid={!!errors.name}
              {...register('name', {
                validate: (v) => (v.trim().length >= 1 && v.trim().length <= 255) || t('Enter a name of 1 to 255 characters'),
              })}
            />
            {errorText('name')}
            {duplicateName ? (
              <span className="text-sm text-amber-600">
                {t('A source with this name already exists. Save again to create it anyway.')}
              </span>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>{t('Source type')}</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GIFT_SOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(GIFT_SOURCE_TYPE_LABEL[type])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errorText('type')}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="source-contact">{t('Contact person')}</FieldLabel>
              <Input id="source-contact" className={inputClass} disabled={busy} {...register('contactName')} />
              {errorText('contactName')}
            </Field>
            <Field>
              <FieldLabel htmlFor="source-phone">{t('Phone number')}</FieldLabel>
              <Input
                id="source-phone"
                type="tel"
                className={inputClass}
                disabled={busy}
                aria-invalid={!!errors.contactPhone}
                {...register('contactPhone', {
                  validate: (v) => !v.trim() || PHONE_PATTERN.test(v.trim()) || t('Enter 7 to 32 digits'),
                })}
              />
              {errorText('contactPhone')}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="source-email">{t('Email')}</FieldLabel>
            <Input
              id="source-email"
              type="email"
              className={inputClass}
              disabled={busy}
              aria-invalid={!!errors.contactEmail}
              {...register('contactEmail', {
                validate: (v) => !v.trim() || EMAIL_PATTERN.test(v.trim()) || t('Enter a valid email'),
              })}
            />
            {errorText('contactEmail')}
          </Field>

          <SingleImageFileField
            control={control}
            name="logo"
            label={t('Logo')}
            disabled={busy}
            isDark={isDark}
            helperText={source?.logo && !watch('logo') ? t('Current logo will be kept unless you choose a new file.') : undefined}
          />
          {source?.logo ? (
            <Controller
              control={control}
              name="removeLogo"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} disabled={busy} />
                  {t('Remove current logo')}
                </label>
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="showOnGift"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} disabled={busy} />
                {t('Show as sponsor on the gift page')}
              </label>
            )}
          />

          <Field>
            <FieldLabel htmlFor="source-note">{t('Note')}</FieldLabel>
            <Textarea
              id="source-note"
              rows={3}
              disabled={busy}
              className="!border !border-zinc-300"
              {...register('note', { maxLength: { value: 2000, message: t('At most 2000 characters') } })}
            />
            {errorText('note')}
          </Field>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="!h-[45px] cursor-pointer px-4">
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={busy} className="!h-[45px] cursor-pointer px-4">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t('Saving')} /> : t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
