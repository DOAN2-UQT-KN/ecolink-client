import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbUserEdit } from 'react-icons/tb';

import { useSetShiftLeader } from '@/apis/campaign/setShiftLeader';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useLeaderOptions } from '../../_hooks/useLeaderOptions';

/**
 * Managers choose who leads a shift that has not ended (spec 3.4). Only the campaign's team is
 * offered: its creator, its managers and the organization's owners.
 */
export const ChangeShiftLeaderButton = memo(function ChangeShiftLeaderButton({
  campaignId,
  shiftId,
  organizationId,
  createdBy,
  leaderUserId,
}: {
  campaignId: string;
  shiftId: string;
  organizationId: string;
  createdBy?: string;
  leaderUserId: string | null;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | undefined>(leaderUserId ?? undefined);
  const options = useLeaderOptions({ organizationId, campaignId, createdBy, enabled: open });
  const { mutate, isPending } = useSetShiftLeader({ onSuccess: () => setOpen(false) });

  return (
    <>
      <Button
        type="button"
        variant="outlined-brown"
        iconLeft={<TbUserEdit className="size-4" aria-hidden />}
        onClick={() => {
          setPicked(leaderUserId ?? undefined);
          setOpen(true);
        }}
      >
        {leaderUserId ? t('Change') : t('Assign')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Person in charge')}</DialogTitle>
            <DialogDescription>
              {t(
                "Only the campaign's managers and the organization's owners can lead a shift. Add managers on the campaign page.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="!h-[44px] w-full">
              <SelectValue placeholder={t('Choose a manager')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.user?.name || m.user?.email || m.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={!picked || picked === leaderUserId || isPending}
              onClick={() =>
                picked &&
                mutate({ campaign_id: campaignId, shift_id: shiftId, leader_user_id: picked })
              }
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
