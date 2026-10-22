import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { useGetGiftSources } from '@/apis/gift-source/getGiftSources';
import { useCreateStockBatch } from '@/apis/gift-stock/createStockBatch';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { uploadToCloudinary } from '@/libs/cloudinary';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { ProofFilesField } from './ProofFilesField';
import { SourceAvatar } from '../SourceAvatar';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import {
  defaultStockInValues,
  digitsOnly,
  groupThousands,
  isProofFileType,
  isWholeNumber,
  MAX_PROOF_FILE_BYTES,
  MAX_PROOF_FILES,
  todayVn,
  toStockInRequest,
  type StockInFormValues,
} from '../../_services/stockForm.service';

const FIELDS = ['sourceId', 'quantity', 'unitValueVnd', 'receivedAt', 'expiresAt', 'reference', 'note'] as const;

type Props = { giftId: string; open: boolean; onOpenChange: (open: boolean) => void };

export function StockInDialog({ giftId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const sourcesQuery = useGetGiftSources({ status: 'ACTIVE', limit: 100 }, { enabled: open });
  const sources = sourcesQuery.data?.data?.sources ?? [];
  const { mutateAsync, isPending } = useCreateStockBatch({ onSuccess: () => onOpenChange(false) });

  const {
    register,
    control,
    reset,
    setError,
    getValues,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockInFormValues>({ defaultValues: defaultStockInValues() });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const busy = isPending || uploading;

  useEffect(() => {
    if (!open) return;
    reset(defaultStockInValues());
    setFiles([]);
  }, [open, reset]);

  const addFiles = (picked: FileList | null) => {
    const list = Array.from(picked ?? []);
    const rejected = list.filter((f) => !isProofFileType(f) || f.size > MAX_PROOF_FILE_BYTES);
    if (rejected.length > 0) {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Only images or PDF files up to 10 MB') });
    }
    setFiles((prev) => [...prev, ...list.filter((f) => !rejected.includes(f))].slice(0, MAX_PROOF_FILES));
  };

  const onSubmit = handleSubmit(async (values) => {
    let attachmentUrls: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        attachmentUrls = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      } catch {
        showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload the documents') });
        return;
      } finally {
        setUploading(false);
      }
    }
    try {
      await mutateAsync({ giftId, data: toStockInRequest(values, attachmentUrls) });
    } catch (error) {
      for (const e of fieldErrorsFromApi(error)) {
        const field = FIELDS.find((f) => f === e.field);
        if (field) setError(field, { message: e.message });
      }
    }
  });

  const inputClass = 'h-10 !border !border-zinc-300';
  const err = (f: (typeof FIELDS)[number]) =>
    errors[f] ? <span className="text-sm text-red-500">{errors[f]?.message}</span> : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        className={cn('max-h-[90vh] max-w-lg gap-4 overflow-x-hidden overflow-y-auto', isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold">{t('Receive stock')}</DialogTitle>
        </DialogHeader>
        <form className="min-w-0 space-y-4" onSubmit={onSubmit} noValidate>
          <Field>
            <FieldLabel>{t('Gift source')}</FieldLabel>
            <Controller
              control={control}
              name="sourceId"
              rules={{ required: t('Choose a source') }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={busy || sourcesQuery.isLoading}>
                  <SelectTrigger className={inputClass} aria-invalid={!!errors.sourceId}>
                    <SelectValue placeholder={sourcesQuery.isLoading ? t('Loading...') : t('Choose a source')} />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <SourceAvatar name={s.name} logoUrl={s.logo?.url} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {!sourcesQuery.isLoading && sources.length === 0 ? (
              <span className="text-sm text-foreground-secondary">{t('No partnering source. Create one on the Gift sources page first.')}</span>
            ) : null}
            {err('sourceId')}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="stock-qty">{t('Quantity')}</FieldLabel>
              <Input
                id="stock-qty"
                inputMode="numeric"
                className={inputClass}
                disabled={busy}
                aria-invalid={!!errors.quantity}
                {...register('quantity', { validate: (v) => isWholeNumber(v, 1) || t('Enter a whole number of at least 1') })}
              />
              {err('quantity')}
            </Field>
            <Field>
              <FieldLabel htmlFor="stock-value">{t('Value per item (VND)')}</FieldLabel>
              <Controller
                control={control}
                name="unitValueVnd"
                rules={{ validate: (v) => isWholeNumber(v, 0) || t('Enter a whole number of at least 0') }}
                render={({ field }) => (
                  <Input
                    id="stock-value"
                    inputMode="numeric"
                    className={inputClass}
                    disabled={busy}
                    aria-invalid={!!errors.unitValueVnd}
                    value={groupThousands(field.value)}
                    onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {err('unitValueVnd')}
            </Field>
            <Field>
              <FieldLabel htmlFor="stock-received">{t('Received on')}</FieldLabel>
              <Input
                id="stock-received"
                type="date"
                max={todayVn()}
                className={inputClass}
                disabled={busy}
                aria-invalid={!!errors.receivedAt}
                {...register('receivedAt', {
                  validate: (v) => (Boolean(v) && v <= todayVn()) || t('Pick a date that is not in the future'),
                })}
              />
              {err('receivedAt')}
            </Field>
            <Field>
              <FieldLabel htmlFor="stock-expires">{t('Expires on (optional)')}</FieldLabel>
              <Input
                id="stock-expires"
                type="date"
                min={watch('receivedAt') || undefined}
                className={inputClass}
                disabled={busy}
                aria-invalid={!!errors.expiresAt}
                {...register('expiresAt', {
                  validate: (v) => !v || v > getValues('receivedAt') || t('Must be after the received date'),
                })}
              />
              {err('expiresAt')}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="stock-ref">{t('Reference (contract, letter, invoice, receipt)')}</FieldLabel>
            <Input
              id="stock-ref"
              className={inputClass}
              disabled={busy}
              aria-invalid={!!errors.reference}
              {...register('reference', {
                validate: (v) =>
                  v.trim().length > 255
                    ? t('At most 255 characters')
                    : v.trim().length > 0 || files.length > 0 || t('Enter a reference or attach a document'),
              })}
            />
            {err('reference')}
          </Field>

          <Field>
            <FieldLabel>{t('Documents')}</FieldLabel>
            <ProofFilesField
              files={files}
              onAdd={addFiles}
              onRemove={(i) => setFiles((prev) => prev.filter((_, j) => j !== i))}
              disabled={busy}
              isDark={isDark}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="stock-note">{t('Note')}</FieldLabel>
            <Textarea
              id="stock-note"
              rows={2}
              className="!border !border-zinc-300"
              disabled={busy}
              {...register('note', { maxLength: { value: 2000, message: t('At most 2000 characters') } })}
            />
            {err('note')}
          </Field>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="!h-[45px] cursor-pointer px-4">
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={busy} className="!h-[45px] cursor-pointer px-4">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t('Saving')} /> : t('Receive stock')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
