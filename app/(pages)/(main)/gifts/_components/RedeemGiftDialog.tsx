import { FormEvent, memo, useEffect, useState } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { TbCoinFilled } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

import type { IGift, IRedeemGiftRequest } from '@/apis/gift/models/gift';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type RedeemGiftDialogProps = {
  gift: IGift | null;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: IRedeemGiftRequest) => Promise<void>;
};

export const RedeemGiftDialog = memo(function RedeemGiftDialog({
  gift,
  open,
  pending = false,
  onOpenChange,
  onSubmit,
}: RedeemGiftDialogProps) {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  useEffect(() => {
    if (!open) {
      setPhoneNumber('');
      setPickupLocation('');
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gift || pending) return;

    await onSubmit({
      id: gift.id,
      phoneNumber: phoneNumber.trim(),
      pickupLocation: pickupLocation.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-[rgba(136,122,71,0.35)] bg-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('Redeem gift')}</DialogTitle>
            <DialogDescription>
              {gift
                ? t('Enter your receiving information for {{name}}.', { name: gift.name })
                : t('Enter your receiving information.')}
            </DialogDescription>
          </DialogHeader>

          {gift && (
            <div className="flex items-center justify-between rounded-lg border border-[rgba(136,122,71,0.28)] bg-[#fbfaf5] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{gift.name}</p>
                <p className="text-xs text-muted-foreground">{t('Order starts as Processing')}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-sm font-semibold text-button-accent">
                <TbCoinFilled className="size-4 text-yellow-500" />
                {gift.greenPoints}
              </span>
            </div>
          )}

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Phone className="size-4" />
              {t('Phone number')}
            </span>
            <Input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder={t('Enter phone number')}
              required
              minLength={7}
              maxLength={32}
              inputMode="tel"
              className="!h-11"
            />
          </label>

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4" />
              {t('Receiving address')}
            </span>
            <Textarea
              value={pickupLocation}
              onChange={(event) => setPickupLocation(event.target.value)}
              placeholder={t('Enter receiving address')}
              required
              maxLength={1000}
              className="min-h-24"
            />
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={pending || !gift}>
              {pending ? t('Submitting') : t('Redeem')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
