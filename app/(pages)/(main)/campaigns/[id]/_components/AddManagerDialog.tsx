import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbUserPlus } from 'react-icons/tb';

import { useAddCampaignManagers } from '@/apis/campaign/addCampaignManagers';
import { Button } from '@/components/client/shared/Button';
import {
  AutoCompleteUser,
  type AutoCompleteUserValue,
} from '@/components/form/AutoCompleteUser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Manager picker: only active members of the campaign's organization who aren't managers yet. */
export const AddManagerDialog = memo(function AddManagerDialog({
  campaignId,
  organizationId,
  managerIds,
}: {
  campaignId: string;
  organizationId: string;
  managerIds: Set<string>;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<AutoCompleteUserValue | null>(null);

  const { mutate: addManagers, isPending } = useAddCampaignManagers({
    onSuccess: () => {
      setOpen(false);
      setPicked(null);
    },
  });

  return (
    <>
      <Button
        variant="outlined-brown"
        size="medium"
        iconLeft={<TbUserPlus className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {t('Add manager')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPicked(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Add a campaign manager')}</DialogTitle>
            <DialogDescription>
              {t('Only active members of the organization can manage this campaign.')}
            </DialogDescription>
          </DialogHeader>
          <AutoCompleteUser
            organizationId={organizationId}
            value={picked}
            onChange={setPicked}
            isUserDisabled={(u) => !u.is_member || managerIds.has(u.id)}
          />
          {picked && !picked.userId ? (
            <p className="text-sm text-destructive">
              {t('Pick an existing member of the organization.')}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={!picked?.userId || isPending}
              onClick={() =>
                picked?.userId && addManagers({ campaignId, user_ids: [picked.userId] })
              }
            >
              {t('Add manager')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
