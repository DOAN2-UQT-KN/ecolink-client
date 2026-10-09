import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbArrowRight, TbPencil } from 'react-icons/tb';

import { Button } from '@/components/client/shared/Button';
import { useRouter } from '@/libs/router';
import useAuthStore from '@/stores/useAuthStore';
import { JoinShiftsDialog } from './JoinShiftsDialog';

export function JoinShiftsCta({
  campaignId,
  isRegistered,
  canJoin,
  returnTo,
}: {
  campaignId: string;
  isRegistered: boolean;
  canJoin: boolean;
  returnTo: string;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!isRegistered && !canJoin) return null;

  const openJoin = () => {
    // Read at click time, after the auth store has hydrated.
    if (!useAuthStore.getState().is_authenticated) {
      router.push(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      {isRegistered ? (
        <Button
          type="button"
          variant="outlined-brown"
          size="medium"
          iconLeft={<TbPencil className="size-4" aria-hidden />}
          onClick={openJoin}
        >
          {t('Edit my shifts')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="brown"
          size="medium"
          iconRight={<TbArrowRight className="size-4" aria-hidden />}
          onClick={openJoin}
        >
          {t('Join')}
        </Button>
      )}
      <JoinShiftsDialog campaignId={campaignId} open={open} onOpenChange={setOpen} />
    </>
  );
}
