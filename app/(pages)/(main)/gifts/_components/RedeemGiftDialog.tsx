import { memo, useEffect, useMemo, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Building2, MapPin, MessageSquareText, Package, Phone, UserRound } from 'lucide-react';
import { TbCoinFilled } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

import type { IGift, IRedeemGiftRequest } from '@/apis/gift/models/gift';
import { useGetPoints } from '@/apis/points/getPoints';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useAuthStore from '@/stores/useAuthStore';
import { formatVnPhone, isVnMobile, phoneDigits } from '@/utils/phone';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import { DeliveryAddressField } from './DeliveryAddressField';
import { QuantityField } from './QuantityField';
import {
  emptyRedeemForm,
  MAX_ADDRESS_DETAIL,
  MAX_DELIVERY_NOTE,
  MAX_RECIPIENT_NAME,
  quantityLimit,
  REDEEM_FIELD_BY_API,
  toRedeemRequest,
  type RedeemFormValues,
} from '../_services/redeemForm.service';

type RedeemGiftDialogProps = {
  gift: IGift | null;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: IRedeemGiftRequest) => Promise<void>;
};

const Label = ({
  icon,
  htmlFor,
  required,
  children,
}: {
  icon: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium">
    {icon}
    <span>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden>
          {' '}*
        </span>
      ) : null}
    </span>
  </label>
);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="text-sm text-red-600">
      {message}
    </p>
  ) : null;

export const RedeemGiftDialog = memo(function RedeemGiftDialog({
  gift,
  open,
  pending = false,
  onOpenChange,
  onSubmit,
}: RedeemGiftDialogProps) {
  const { t } = useTranslation();
  const { title } = useLocalizedDisplay();
  const accountName = useAuthStore((s) => s.user?.name ?? '');
  const {
    control,
    register,
    reset,
    setError,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RedeemFormValues>({ defaultValues: emptyRedeemForm(accountName) });
  // Only to cap the quantity; the server checks the balance again.
  const { data: points } = useGetPoints({}, { enabled: open });
  const balance = points?.data?.balance ?? null;
  const limit = useMemo(
    () => quantityLimit({ stock: gift?.stockRemaining ?? 0, balance, unitPoints: gift?.greenPoints ?? 0 }),
    [gift?.stockRemaining, gift?.greenPoints, balance],
  );
  const quantity = watch('quantity');
  const unitPoints = gift?.greenPoints ?? 0;
  const total = unitPoints * (Number.isFinite(quantity) ? quantity : 1);

  // Stock or balance refetched lower than what was picked: pull the pick down to what is possible.
  useEffect(() => {
    if (open && quantity > limit.max) setValue('quantity', limit.max);
  }, [open, quantity, limit.max, setValue]);

  useEffect(() => {
    if (open) reset(emptyRedeemForm(accountName));
  }, [open, accountName, reset]);

  const submit = handleSubmit(async (values) => {
    if (!gift || pending) return;
    try {
      await onSubmit(toRedeemRequest(gift.id, values));
      onOpenChange(false);
    } catch (error) {
      // usePost already shows the toast; mark the fields the server rejected.
      for (const e of fieldErrorsFromApi(error)) {
        const field = REDEEM_FIELD_BY_API[e.field];
        if (field) setError(field, { message: e.message });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border border-[rgba(136,122,71,0.35)] bg-white">
        <div className="min-w-0 space-y-5">
          <DialogHeader>
            <DialogTitle>{t('Redeem gift')}</DialogTitle>
          </DialogHeader>

          {/* The gift and how many of it: price per item, quantity and the running total in one card. */}
          <section
            className="space-y-3 rounded-lg border border-[rgba(136,122,71,0.28)] bg-[#fbfaf5] p-4"
            aria-label={t('Gift')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground [overflow-wrap:anywhere]">{gift ? title(gift) : ''}</p>
                <p className="text-xs text-muted-foreground">{t('Order starts as Processing')}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-sm font-semibold text-button-accent">
                <TbCoinFilled className="size-4 text-yellow-500" aria-hidden />
                <span className="tabular-nums">{unitPoints}</span>
                <span className="font-normal text-muted-foreground">{t('per item')}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-[rgba(136,122,71,0.2)] pt-3">
              <div className="space-y-2">
                <Label icon={<Package className="size-4" />} htmlFor="redeem-quantity" required>
                  {t('Quantity')}
                </Label>
                <Controller
                  control={control}
                  name="quantity"
                  rules={{
                    validate: (v) =>
                      (Number.isInteger(v) && v >= 1 && v <= limit.max) ||
                      t('Choose 1 to {{max}} items', { max: limit.max }),
                  }}
                  render={({ field }) => (
                    <QuantityField
                      id="redeem-quantity"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      max={limit.max}
                      reason={limit.reason}
                      disabled={pending || !gift}
                      invalid={!!errors.quantity}
                      describedBy="redeem-quantity-error"
                    />
                  )}
                />
                <FieldError id="redeem-quantity-error" message={errors.quantity?.message} />
              </div>
              <div className="ml-auto text-right" aria-live="polite">
                <p className="text-xs text-muted-foreground">{t('Total')}</p>
                <p className="inline-flex items-center gap-1 text-xl font-semibold text-button-accent tabular-nums">
                  <TbCoinFilled className="size-5 text-yellow-500" aria-hidden />
                  {total}
                </p>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label icon={<UserRound className="size-4" />} htmlFor="redeem-name" required>
                {t('Recipient name')}
              </Label>
              <Input
                id="redeem-name"
                aria-required
                autoComplete="name"
                className="!h-11"
                disabled={pending}
                aria-invalid={!!errors.recipientName}
                aria-describedby="redeem-name-error"
                {...register('recipientName', {
                  validate: (v) => {
                    const n = v.trim().length;
                    if (n === 0) return t('Enter the recipient name');
                    return n <= MAX_RECIPIENT_NAME || t('At most {{max}} characters', { max: MAX_RECIPIENT_NAME });
                  },
                })}
              />
              <FieldError id="redeem-name-error" message={errors.recipientName?.message} />
            </div>

            <div className="space-y-2">
              <Label icon={<Phone className="size-4" />} htmlFor="redeem-phone" required>
                {t('Phone number')}
              </Label>
              <Controller
                control={control}
                name="phone"
                rules={{ validate: (v) => isVnMobile(v) || t('Enter a 10-digit mobile number starting with 0') }}
                render={({ field }) => (
                  <Input
                    id="redeem-phone"
                    aria-required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0901 234 567"
                    className="!h-11 tabular-nums"
                    disabled={pending}
                    aria-invalid={!!errors.phone}
                    aria-describedby="redeem-phone-error"
                    value={formatVnPhone(field.value)}
                    onChange={(e) => field.onChange(phoneDigits(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              <FieldError id="redeem-phone-error" message={errors.phone?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label icon={<MapPin className="size-4" />} required>
              {t('Receiving address')}
            </Label>
            <Controller
              control={control}
              name="location"
              rules={{
                validate: (v) =>
                  (v.address.trim().length > 0 && v.lat != null && v.lng != null) ||
                  t('Search an address or drop a pin on the map'),
              }}
              render={({ field }) => (
                <DeliveryAddressField value={field.value} onChange={field.onChange} disabled={pending} />
              )}
            />
            <FieldError id="redeem-location-error" message={errors.location?.message} />
          </div>

          <div className="space-y-2">
            <Label icon={<Building2 className="size-4" />} htmlFor="redeem-detail">
              {t('Address detail')}
            </Label>
            <Input
              id="redeem-detail"
              placeholder={t('House number, building, floor, room')}
              className="!h-11"
              disabled={pending}
              aria-invalid={!!errors.addressDetail}
              {...register('addressDetail', {
                maxLength: { value: MAX_ADDRESS_DETAIL, message: t('At most {{max}} characters', { max: MAX_ADDRESS_DETAIL }) },
              })}
            />
            <FieldError id="redeem-detail-error" message={errors.addressDetail?.message} />
          </div>

          <div className="space-y-2">
            <Label icon={<MessageSquareText className="size-4" />} htmlFor="redeem-note">
              {t('Note for delivery')}
            </Label>
            <Textarea
              id="redeem-note"
              rows={2}
              placeholder={t('E.g. call before coming, deliver after 5 PM')}
              disabled={pending}
              aria-invalid={!!errors.deliveryNote}
              {...register('deliveryNote', {
                maxLength: { value: MAX_DELIVERY_NOTE, message: t('At most {{max}} characters', { max: MAX_DELIVERY_NOTE }) },
              })}
            />
            <FieldError id="redeem-note-error" message={errors.deliveryNote?.message} />
          </div>

          <DialogFooter>
            <Button
              variant="outlined-brown"
              size="medium"
              className="!h-[44px]"
              onClick={() => onOpenChange(false)}
              isDisabled={pending}
            >
              {t('Cancel')}
            </Button>
            {/* Not a form submit (the client Button is type="button"): Enter in the address search looks it up. */}
            <Button
              variant="brown"
              size="medium"
              className="!h-[44px]"
              onClick={() => void submit()}
              isLoading={pending}
              isDisabled={!gift}
            >
              {t('Redeem')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
});
