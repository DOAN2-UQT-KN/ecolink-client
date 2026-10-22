import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirmMyRedemption } from '@/apis/gift/confirmMyRedemption';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** The customer confirms a shipped order arrived; it moves to Delivered. Same dialog look as CancelOrderDialog. */
export function ConfirmDeliveryButton({ code, className }: { code: string; className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // A stale status (422) is reported by usePost's toast, and the order refetches on settle.
  const { mutateAsync, isPending } = useConfirmMyRedemption();

  const confirm = async () => {
    await mutateAsync({ code }).catch(() => undefined);
    setOpen(false);
  };

  return (
    <>
      <Button type="button" variant="brown" size="medium" className={className} onClick={() => setOpen(true)}>
        {t('I received it')}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent className="max-w-md border border-[rgba(136,122,71,0.35)] bg-white">
          <DialogHeader>
            <DialogTitle>{t('Confirm you have received this gift?')}</DialogTitle>
            <DialogDescription>{t('The order will be marked as delivered.')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outlined-brown"
              size="medium"
              className="!h-[44px]"
              onClick={() => setOpen(false)}
              isDisabled={isPending}
            >
              {t('Not yet')}
            </Button>
            <Button variant="brown" size="medium" className="!h-[44px]" onClick={() => void confirm()} isLoading={isPending}>
              {t('I received it')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
