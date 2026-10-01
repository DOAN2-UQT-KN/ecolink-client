import Image from '@/components/ui/AppImage';
import { memo, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbUserMinus, TbUserPlus } from 'react-icons/tb';

import {
  useAddCampaignManagers,
  useGetCampaignManager,
  useRemoveCampaignManager,
} from '@/apis/campaign/campaignManager';
import { useGetCampaignVolunteer } from '@/apis/campaign/campaignVolunteer';
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
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ADMIN_ROLE_ID } from '@/constants/roles';
import { STATUS } from '@/constants/status';
import defaultAvatar from '@/public/default-avatar.png';
import useAuthStore from '@/stores/useAuthStore';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

interface AvatarListItem {
  id: string;
  avatar?: string | null;
  name?: string | null;
  checkedIn?: boolean;
}

function AvatarList({
  isLoading,
  items,
  showAttendance,
  renderBadge,
  renderAction,
}: {
  isLoading: boolean;
  items: AvatarListItem[];
  showAttendance?: boolean;
  renderBadge?: (item: AvatarListItem) => ReactNode;
  renderAction?: (item: AvatarListItem) => ReactNode;
}) {
  const { t } = useTranslation('common');
  if (isLoading) {
    return (
      <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 max-w-full" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 items-center gap-3 py-3 font-display-1">
          <Image
            src={item.avatar || defaultAvatar}
            alt={item.name || 'Default Avatar'}
            width={40}
            height={40}
            className="shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <span className="min-w-0 break-words font-medium text-foreground">
              {item.name || '—'}
            </span>
            {showAttendance ? (
              <Pill tone={item.checkedIn ? 'green' : 'amber'}>
                {item.checkedIn ? t('Attendance checked in') : t('Attendance not checked in')}
              </Pill>
            ) : null}
            {renderBadge?.(item)}
          </div>
          {renderAction?.(item)}
        </li>
      ))}
    </ul>
  );
}

/** Manager picker: only active members of the campaign's organization who aren't managers yet. */
const AddManagerDialog = memo(function AddManagerDialog({
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

const RemoveManagerAction = memo(function RemoveManagerAction({
  campaignId,
  manager,
}: {
  campaignId: string;
  manager: AvatarListItem;
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
              {t('They will no longer be able to manage this campaign.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={isPending}
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

export const CurrentMember = memo(function CurrentMember() {
  const { t } = useTranslation('common');
  const { campaignId, campaign, canManageCampaign } = useCampaignDetail();
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);

  // Server returns 403 for anyone else (CAMPAIGN_PERMISSION_DENIED), so don't even ask.
  const canViewVolunteers =
    canManageCampaign || campaign?.request_status === STATUS.APPROVED || isPlatformAdmin;

  const { data: volunteerData, isLoading: isVolunteerLoading } = useGetCampaignVolunteer(
    { campaignId, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' },
    { enabled: Boolean(campaignId) && canViewVolunteers },
  );

  const { data: managerData, isLoading: isManagerLoading } = useGetCampaignManager(
    { campaignId, limit: 100, sortBy: 'assignedAt', sortOrder: 'asc' },
    { enabled: Boolean(campaignId) },
  );

  const volunteers = (volunteerData?.data?.volunteers ?? []).map((v) => ({
    id: v.id,
    avatar: v?.volunteer?.avatar,
    name: v?.volunteer?.name,
    checkedIn: Boolean(v.checked_in_at),
  }));

  const managers = useMemo(
    () =>
      (managerData?.data?.managers ?? []).map((m) => ({
        id: m.user_id,
        avatar: m.avatar,
        name: m.name,
      })),
    [managerData?.data?.managers],
  );

  const creatorId = campaign?.created_by ?? campaign?.owner?.id;
  const managerIds = useMemo(() => {
    const ids = new Set(managers.map((m) => m.id));
    if (creatorId) ids.add(creatorId);
    return ids;
  }, [managers, creatorId]);

  const organizationId = campaign?.organization_id;

  return (
    <div className="flex flex-col gap-4">
      {/* Managers card */}
      <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display-1 text-muted-foreground">
            {t('Managers')}:{' '}
            <span className="font-medium text-foreground tabular-nums">{managers.length}</span>
          </p>
          {canManageCampaign && organizationId ? (
            <AddManagerDialog
              campaignId={campaignId}
              organizationId={organizationId}
              managerIds={managerIds}
            />
          ) : null}
        </div>
        <AvatarList
          isLoading={isManagerLoading}
          items={managers}
          renderBadge={(item) =>
            item.id === creatorId ? <Pill tone="brand">{t('Creator')}</Pill> : null
          }
          renderAction={
            canManageCampaign
              ? (item) =>
                  item.id === creatorId ? null : (
                    <RemoveManagerAction campaignId={campaignId} manager={item} />
                  )
              : undefined
          }
        />
      </div>

      {/* Members card */}
      <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
        {canViewVolunteers ? (
          <AvatarList isLoading={isVolunteerLoading} items={volunteers} showAttendance />
        ) : (
          <p className="text-sm text-foreground-tertiary">
            {t('Only managers and approved volunteers can see the volunteer list.')}
          </p>
        )}
      </div>
    </div>
  );
});
