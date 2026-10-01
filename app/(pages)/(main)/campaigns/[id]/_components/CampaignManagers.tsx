import { memo, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { TbUserMinus, TbUserPlus } from 'react-icons/tb';

import {
  useAddCampaignManagers,
  useGetCampaignManager,
  useRemoveCampaignManager,
} from '@/apis/campaign/campaignManager';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@/libs/router';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { AvatarList, type AvatarListItem } from './AvatarList';

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

/** "Managers" tab: the campaign's managers, each with the shifts they are in charge of. */
export const CampaignManagers = memo(function CampaignManagers() {
  const { t } = useTranslation('common');
  const { campaignId, campaign, canManageCampaign } = useCampaignDetail();

  const { data: managerData, isLoading: isManagerLoading } = useGetCampaignManager(
    { campaignId, limit: 100, sortBy: 'assignedAt', sortOrder: 'asc' },
    { enabled: Boolean(campaignId) },
  );

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

  /** Shifts each person leads, in time order. */
  const shiftsByLeader = useMemo(() => {
    const points = campaign?.meeting_points ?? [];
    const out = new Map<string, { id: string; label: string }[]>();
    [...(campaign?.shifts ?? [])]
      .filter((sh) => sh.min_volunteers > 0 && sh.leader_user_id)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .forEach((sh) => {
        const index = points.findIndex((p) => p.id === sh.meeting_point_id);
        const point = points[index]?.name || t('Meeting point {{n}}', { n: index + 1 });
        const label = `${point} · ${format(new Date(sh.start_at), 'dd/MM HH:mm')}`;
        const id = sh.leader_user_id as string;
        out.set(id, [...(out.get(id) ?? []), { id: sh.id, label }]);
      });
    return out;
  }, [campaign?.meeting_points, campaign?.shifts, t]);

  const organizationId = campaign?.organization_id;

  return (
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
        renderBadge={(item) => {
          const led = shiftsByLeader.get(item.id) ?? [];
          return (
            <>
              {item.id === creatorId ? <Pill tone="brand">{t('Creator')}</Pill> : null}
              {led.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-foreground-tertiary">{t('Shifts in charge')}:</span>
                  {led.map((sh) => (
                    <Link
                      key={sh.id}
                      href={`/campaigns/${campaignId}/shifts/${sh.id}`}
                      className="rounded-full border border-[rgba(136,122,71,0.4)] px-2 py-0.5 text-xs text-button-accent hover:bg-[#887A47]/10"
                    >
                      {sh.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          );
        }}
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
  );
});

export default CampaignManagers;
