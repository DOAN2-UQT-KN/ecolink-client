import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { useUpdateGiftRedemptionStatus } from '@/apis/gift/adminGiftRedemptions';
import type { IAdminGiftRedemptionListItem } from '@/apis/gift/models/gift';
import { useUpdateRedemptionTracking } from '@/apis/gift/updateRedemptionTracking';
import type { QueryError } from '@/hooks/reactQuery';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/libs/utils';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import { OTHER_CARRIER } from '../_config/carriers';
import { SelectListCarrier } from './SelectListCarrier';
import {
  MAX_CARRIER,
  toShipFields,
  toShipForm,
  TRACKING_CODE_PATTERN,
  type ShipFormValues,
} from '../_services/redemption.service';

type Props = {
  order: IAdminGiftRedemptionListItem | null;
  /** `ship` moves a PROCESSING order to SHIPPED; `edit` fixes the code of a SHIPPED one. */
  mode: 'ship' | 'edit';
  onClose: () => void;
};

/** Shipping needs the carrier and its tracking code (spec 017 US1). */
export function ShipOrderDialog({ order, mode, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const ship = useUpdateGiftRedemptionStatus({ onSuccess: onClose });
  const edit = useUpdateRedemptionTracking({ onSuccess: onClose });
  const isPending = ship.isPending || edit.isPending;
  const {
    control,
    register,
    reset,
    watch,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<ShipFormValues>({ defaultValues: toShipForm(null, null) });
  const isOther = watch('carrierChoice') === OTHER_CARRIER;

  useEffect(() => {
    if (order) reset(toShipForm(order.carrier, order.trackingCode));
  }, [order, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!order) return;
    const fields = toShipFields(values);
    try {
      if (mode === 'ship') await ship.mutateAsync({ id: order.id, status: 'SHIPPED', ...fields });
      else await edit.mutateAsync({ id: order.id, ...fields });
    } catch (error) {
      // 409: another admin shipped it first; the list refetches (usePost) and shows their code.
      if ((error as QueryError)?.status === 409) {
        onClose();
        return;
      }
      for (const e of fieldErrorsFromApi(error)) {
        if (e.field === 'carrier') setError(isOther ? 'otherCarrier' : 'carrierChoice', { message: e.message });
        if (e.field === 'trackingCode') setError('trackingCode', { message: e.message });
      }
    }
  });

  return (
    <Dialog open={Boolean(order)} onOpenChange={(next) => !next && !isPending && onClose()}>
      <DialogContent
        className={cn('max-w-md gap-4', isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold">
            {mode === 'ship' ? t('Ship order') : t('Edit tracking')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {mode === 'ship'
              ? t('Enter the carrier and the tracking code it gave you. The customer sees both.')
              : t('The change is kept in the order history.')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field data-invalid={!!errors.carrierChoice || !!errors.otherCarrier}>
            <FieldLabel htmlFor="ship-carrier">
              {t('Carrier')} <span className="text-red-500" aria-hidden>*</span>
            </FieldLabel>
            <Controller
              control={control}
              name="carrierChoice"
              rules={{ validate: (v) => v !== '' || t('Select a carrier') }}
              render={({ field }) => (
                <SelectListCarrier
                  id="ship-carrier"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  invalid={!!errors.carrierChoice}
                />
              )}
            />
            {isOther ? (
              <Input
                aria-label={t('Carrier name')}
                placeholder={t('Carrier name')}
                autoComplete="off"
                className="!h-10 !border !border-zinc-300"
                disabled={isPending}
                aria-required
                aria-invalid={!!errors.otherCarrier}
                aria-describedby="ship-carrier-error"
                {...register('otherCarrier', {
                  validate: (v) => {
                    if (!isOther) return true;
                    const n = v.trim().length;
                    if (n === 0) return t('Enter the carrier');
                    return n <= MAX_CARRIER || t('At most {{max}} characters', { max: MAX_CARRIER });
                  },
                })}
              />
            ) : null}
            <span id="ship-carrier-error" className="text-sm text-red-500">
              {errors.carrierChoice?.message ?? errors.otherCarrier?.message}
            </span>
          </Field>

          <Field data-invalid={!!errors.trackingCode}>
            <FieldLabel htmlFor="ship-tracking">
              {t('Tracking code')} <span className="text-red-500" aria-hidden>*</span>
            </FieldLabel>
            <Input
              id="ship-tracking"
              autoComplete="off"
              spellCheck={false}
              className="!h-10 !border !border-zinc-300 font-mono"
              disabled={isPending}
              aria-required
              aria-invalid={!!errors.trackingCode}
              aria-describedby="ship-tracking-error"
              {...register('trackingCode', {
                validate: (v) =>
                  TRACKING_CODE_PATTERN.test(v.trim()) ||
                  t('Use 1–100 letters, digits or . _ / - (no spaces)'),
              })}
            />
            <span id="ship-tracking-error" className="text-sm text-red-500">{errors.trackingCode?.message}</span>
          </Field>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="!h-[45px] cursor-pointer px-4">
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="!h-[45px] cursor-pointer px-4">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-label={t('Saving')} />
              ) : mode === 'ship' ? (
                t('Mark as shipped')
              ) : (
                t('Save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
