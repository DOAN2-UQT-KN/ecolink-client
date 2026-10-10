import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbUserMinus } from 'react-icons/tb';

import { useRemoveCampaignManager } from '@/apis/campaign/removeCampaignManager';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AvatarListItem } from '@/components/client/shared/AvatarList';

import { ShiftChip } from './ShiftChip';

export const RemoveManagerAction = memo(function RemoveManagerAction({
  campaignId,
  manager,
  ledShifts,
}: {
  campaignId: string;
  manager: AvatarListItem;
  /** Shifts still to come that they lead; they are reassigned first (spec 3.4). */
  ledShifts: { id: string; label: string }[];
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const { mutate: removeManager, isPending } = useRemoveCampaignManager({
    onSuccess: () => setOpen(false),
  });
  const name = manager.name || '—';

  return (
    <div className="flex items-center sm:ml-auto">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t('Remove manager')}
            onClick={() => setOpen(true)}
            className="flex size-9 items-center cursor-pointer justify-center rounded-md border border-[rgba(136,122,71,0.45)] text-button-accent transition-colors hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <TbUserMinus className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('Remove manager')}</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Remove {{name}} as manager?', { name })}</DialogTitle>
            <DialogDescription>
              {ledShifts.length > 0
                ? t('{{name}} still leads these shifts. Assign another person in charge first.', {
                    name,
                  })
                : t('They will no longer be able to manage this campaign.')}
            </DialogDescription>
          </DialogHeader>
          {ledShifts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ledShifts.map((sh) => (
                <ShiftChip key={sh.id} campaignId={campaignId} shift={sh} />
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={isPending || ledShifts.length > 0}
              onClick={() => removeManager({ campaignId, user_id: manager.id })}
            >
              {t('Remove manager')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
