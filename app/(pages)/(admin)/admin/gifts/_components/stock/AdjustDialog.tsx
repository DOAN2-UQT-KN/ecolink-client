import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import type { StockAdjustReason } from '@/apis/gift-source/models/giftSource';
import { useAdjustStockBatch } from '@/apis/gift-stock/adjustStockBatch';
import type { IStockBatch } from '@/apis/gift-stock/models/stock';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/libs/utils';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import { ADJUST_REASON_LABEL, ADJUST_REASONS, isWholeNumber } from '../../_services/stockForm.service';

type Values = { quantity: string; reason: StockAdjustReason | ''; note: string };
const EMPTY: Values = { quantity: '1', reason: '', note: '' };

type Props = { batch: IStockBatch | null; onClose: () => void };

/** Writes items off one batch; there is no way to add items here (a surplus is a new batch). */
export function AdjustDialog({ batch, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const { mutateAsync, isPending } = useAdjustStockBatch({ onSuccess: onClose });
  const {
    register,
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ defaultValues: EMPTY });

  useEffect(() => {
    if (batch) reset(EMPTY);
  }, [batch, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!batch || !values.reason) return;
    try {
      await mutateAsync({
        batchId: batch.id,
        data: { quantity: Number(values.quantity), reason: values.reason, note: values.note.trim() || null },
      });
    } catch (error) {
      for (const e of fieldErrorsFromApi(error)) {
        if (e.field === 'quantity' || e.field === 'reason' || e.field === 'note') setError(e.field, { message: e.message });
      }
    }
  });

  const max = batch?.remaining ?? 0;

  return (
    <Dialog open={Boolean(batch)} onOpenChange={(next) => !next && !isPending && onClose()}>
      <DialogContent
        className={cn('max-w-md gap-4', isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold">{t('Write off stock')}</DialogTitle>
        </DialogHeader>
        {batch ? (
          <p className="text-sm text-foreground-secondary [overflow-wrap:anywhere]">
            {t('{{source}} batch, {{count}} left', { source: batch.source?.name ?? '', count: batch.remaining })}
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field>
            <FieldLabel htmlFor="adjust-qty">{t('Quantity')}</FieldLabel>
            <Input
              id="adjust-qty"
              inputMode="numeric"
              className="h-10 !border !border-zinc-300"
              disabled={isPending}
              aria-invalid={!!errors.quantity}
              {...register('quantity', {
                validate: (v) =>
                  (isWholeNumber(v, 1) && Number(v) <= max) || t('Enter a whole number from 1 to {{max}}', { max }),
              })}
            />
            {errors.quantity ? <span className="text-sm text-red-500">{errors.quantity.message}</span> : null}
          </Field>
          <Field>
            <FieldLabel>{t('Reason')}</FieldLabel>
            <Controller
              control={control}
              name="reason"
              rules={{ required: t('Choose a reason') }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                  <SelectTrigger className="h-10 !border !border-zinc-300" aria-invalid={!!errors.reason}>
                    <SelectValue placeholder={t('Choose a reason')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUST_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(ADJUST_REASON_LABEL[r])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reason ? <span className="text-sm text-red-500">{errors.reason.message}</span> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="adjust-note">{t('Note')}</FieldLabel>
            <Textarea
              id="adjust-note"
              rows={2}
              className="!border !border-zinc-300"
              disabled={isPending}
              {...register('note', { maxLength: { value: 2000, message: t('At most 2000 characters') } })}
            />
          </Field>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="!h-[45px] cursor-pointer px-4">
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="!h-[45px] cursor-pointer px-4">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t('Saving')} /> : t('Write off')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
