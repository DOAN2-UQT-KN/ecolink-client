import { memo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TbCalendarX } from 'react-icons/tb';

import { useCancelCampaign } from '@/apis/campaign/cancelCampaign';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

const REASON_MAX = 5000;

/**
 * The creator or an owner cancels the campaign, with a reason (spec 3.6). Its waste points go
 * back to the waiting list, every registered volunteer is told, nobody gets points.
 */
export const CancelCampaignButton = memo(function CancelCampaignButton({
  campaign,
}: {
  campaign: ICampaign;
}) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useCancelCampaign({
    onSuccess: () => {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Campaign cancelled'),
      });
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-registration-options'] });
      setOpen(false);
    },
  });

  if (!campaign.can_cancel_campaign) return null;
  const registered = (campaign.shifts ?? []).reduce((n, sh) => n + (sh.registered_count ?? 0), 0);

  return (
    <>
      <Button
        type="button"
        variant="outlined-brown"
        iconLeft={<TbCalendarX className="size-5" aria-hidden />}
        onClick={() => {
          setReason('');
          setOpen(true);
        }}
      >
        {t('Cancel campaign')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Cancel this campaign?')}</DialogTitle>
            <DialogDescription>
              {t(
                'This cannot be undone. Its waste points go back to the waiting list and nobody receives points.',
              )}
            </DialogDescription>
          </DialogHeader>
          {registered > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {t('{{n}} shift registration(s): every registered volunteer will be told.', {
                n: registered,
              })}
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground-tertiary">
              {t('Reason')} <span className="text-destructive">*</span>
            </span>
            <Textarea
              maxLength={REASON_MAX}
              value={reason}
              placeholder={t('Volunteers see this reason')}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Keep the campaign')}
            </Button>
            <Button
              variant="brown"
              isDisabled={!reason.trim() || isPending}
              onClick={() => mutate({ id: campaign.id, reason: reason.trim() })}
            >
              {t('Cancel campaign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default CancelCampaignButton;
