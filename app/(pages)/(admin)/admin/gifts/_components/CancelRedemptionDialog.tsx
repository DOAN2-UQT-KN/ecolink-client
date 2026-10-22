import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { useUpdateGiftRedemptionStatus } from '@/apis/gift/adminGiftRedemptions';
import type { IAdminGiftRedemptionListItem } from '@/apis/gift/models/gift';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/libs/utils';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import {
  EMPTY_CANCEL_FORM,
  MAX_CANCEL_REASON,
  toCancelPayload,
  type CancelFormValues,
} from '../_services/redemption.service';

type Props = { order: IAdminGiftRedemptionListItem | null; onClose: () => void };

/** Cancel with a reason; a shipped order also asks whether the item came back (spec 016 US3). */
export function CancelRedemptionDialog({ order, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const shipped = order?.status === 'SHIPPED';
  const { mutateAsync, isPending } = useUpdateGiftRedemptionStatus({ onSuccess: onClose });
  const {
    control,
    register,
    reset,
    setError,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CancelFormValues>({ defaultValues: EMPTY_CANCEL_FORM, mode: 'onChange' });

  useEffect(() => {
    if (order) reset(EMPTY_CANCEL_FORM);
  }, [order, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!order) return;
    try {
      await mutateAsync(toCancelPayload(order.id, shipped, values));
    } catch (error) {
      for (const e of fieldErrorsFromApi(error)) {
        if (e.field === 'cancelReason') setError('reason', { message: e.message });
        if (e.field === 'restock') setError('restock', { message: e.message });
      }
    }
  });

  const reasonLength = watch('reason').trim().length;

  return (
    <Dialog open={Boolean(order)} onOpenChange={(next) => !next && !isPending && onClose()}>
      <DialogContent
        className={cn('max-w-md gap-4', isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold">{t('Cancel order')}</DialogTitle>
          <DialogDescription className="text-left">
            {t('The user gets their points back and sees the reason in their order history.')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field data-invalid={!!errors.reason}>
            <FieldLabel htmlFor="cancel-reason">{t('Cancel reason')}</FieldLabel>
            <Textarea
              id="cancel-reason"
              rows={3}
              className="!border !border-zinc-300"
              disabled={isPending}
              aria-invalid={!!errors.reason}
              aria-describedby="cancel-reason-count"
              {...register('reason', {
                validate: (v) => {
                  const n = v.trim().length;
                  if (n === 0) return t('Enter a reason');
                  return n <= MAX_CANCEL_REASON || t('At most {{max}} characters', { max: MAX_CANCEL_REASON });
                },
              })}
            />
            <span id="cancel-reason-count" className="flex justify-between gap-2 text-sm">
              <span className="text-red-500">{errors.reason?.message}</span>
              <span className={cn('tabular-nums text-foreground-secondary', reasonLength > MAX_CANCEL_REASON && 'text-red-500')}>
                {reasonLength}/{MAX_CANCEL_REASON}
              </span>
            </span>
          </Field>

          {shipped ? (
            <Field data-invalid={!!errors.restock}>
              <FieldLabel>{t('Did the item come back?')}</FieldLabel>
              <Controller
                control={control}
                name="restock"
                rules={{ validate: (v) => v !== '' || t('Choose one') }}
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange} disabled={isPending} aria-invalid={!!errors.restock}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="yes" />
                      {t('Item is back in stock')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="no" />
                      {t('Item did not come back')}
                    </label>
                  </RadioGroup>
                )}
              />
              {errors.restock ? <span className="text-sm text-red-500">{errors.restock.message}</span> : null}
            </Field>
          ) : (
            <p className="text-sm text-foreground-secondary">{t('The item goes back to its stock batch.')}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="!h-[45px] cursor-pointer px-4">
              {t('Keep order')}
            </Button>
            <Button type="submit" variant="destructive" disabled={!isValid || isPending} className="!h-[45px] cursor-pointer px-4">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t('Saving')} /> : t('Cancel order')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
