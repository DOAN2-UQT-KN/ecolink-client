import { memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TbCalendarOff } from 'react-icons/tb';

import { useCloseShift } from '@/apis/campaign/registration';
import { Button } from '@/components/client/shared/Button';
import { ConfirmPopoverModal } from '@/modules/OrganizationCard/components/ConfirmPopoverModal';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

/**
 * Managers turn a shift off before it starts (spec 3.2); its volunteers are told to pick another
 * shift. Callers hide it on the only running shift of a day.
 */
export const CloseShiftButton = memo(function CloseShiftButton({
  campaignId,
  shiftId,
  registered,
  onClosed,
}: {
  campaignId: string;
  shiftId: string;
  registered: number;
  onClosed?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCloseShift({
    onSuccess: (response) => {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Shift turned off; {{n}} volunteer(s) notified', { n: response.data.notified }),
      });
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-registration-options'] });
      onClosed?.();
    },
  });

  return (
    <ConfirmPopoverModal
      title={t('Turn this shift off?')}
      description={
        registered > 0
          ? t('{{n}} registered volunteer(s) will be told to pick another shift.', { n: registered })
          : t('Nobody has registered for this shift yet.')
      }
      confirmLabel={t('Turn off')}
      cancelLabel={t('Cancel')}
      confirmPending={isPending}
      onConfirm={async () => {
        await mutateAsync({ campaign_id: campaignId, shift_id: shiftId });
      }}
      trigger={
        <Button
          type="button"
          variant="outlined-brown"
          iconLeft={<TbCalendarOff className="size-4" aria-hidden />}
        >
          {t('Turn off')}
        </Button>
      }
    />
  );
});

export default CloseShiftButton;
