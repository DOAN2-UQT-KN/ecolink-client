import { memo, useMemo } from 'react';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { isOwnerRole } from '@/apis/organization/models/organization';
import { Pill } from '@/components/ui/Pill';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { useCampaignManagersList } from '../../_hooks/useCampaignManagersList';
import { AvatarList } from '@/components/client/shared/AvatarList';
import { meetingPointName } from '@/utils/campaignLabels';
import { AddManagerDialog } from './AddManagerDialog';
import { RemoveManagerAction } from './RemoveManagerAction';
import { ShiftChip } from './ShiftChip';

/** "Managers" tab: the campaign's managers, each with the shifts they are in charge of. */
export const CampaignManagers = memo(function CampaignManagers() {
  const { t } = useTranslation('common');
  const { campaignId, campaign, canManageCampaign } = useCampaignDetail();

  const {
    managers,
    query: { isLoading: isManagerLoading },
  } = useCampaignManagersList(campaignId);

  const creatorId = campaign?.created_by ?? campaign?.owner?.id;
  const managerIds = useMemo(() => {
    const ids = new Set(managers.map((m) => m.id));
    if (creatorId) ids.add(creatorId);
    return ids;
  }, [managers, creatorId]);

  /** Shifts each person leads, in time order; `upcoming` only those not ended. */
  const shiftsByLeader = useMemo(() => {
    const points = campaign?.meeting_points ?? [];
    const now = Date.now();
    const out = new Map<string, { id: string; label: string; upcoming: boolean }[]>();
    [...(campaign?.shifts ?? [])]
      .filter((sh) => sh.min_volunteers > 0 && sh.leader_user_id)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .forEach((sh) => {
        const index = points.findIndex((p) => p.id === sh.meeting_point_id);
        const point = meetingPointName(points[index], index, t);
        const label = `${point} · ${format(new Date(sh.start_at), 'dd/MM HH:mm')}`;
        const id = sh.leader_user_id as string;
        const upcoming = new Date(sh.end_at).getTime() > now;
        out.set(id, [...(out.get(id) ?? []), { id: sh.id, label, upcoming }]);
      });
    return out;
  }, [campaign?.meeting_points, campaign?.shifts, t]);

  const organizationId = campaign?.organization_id;
  // Owners stay on the team without being managers, so removing them never strands a shift.
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId ?? '', page: 1, limit: 100 },
    { enabled: Boolean(organizationId && canManageCampaign) },
  );
  const ownerIds = useMemo(
    () =>
      new Set(
        (membersData?.data?.members ?? [])
          .filter((m) => isOwnerRole(m.role))
          .map((m) => m.user_id),
      ),
    [membersData],
  );

  return (
    <CollapsibleCard
      title={
        <>
          {t('Managers')}{' '}
          <span className="font-display-1 font-normal text-muted-foreground tabular-nums">
            ({managers.length})
          </span>
        </>
      }
      actions={
        canManageCampaign && organizationId ? (
          <AddManagerDialog
            campaignId={campaignId}
            organizationId={organizationId}
            managerIds={managerIds}
          />
        ) : undefined
      }
    >
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
                    <ShiftChip key={sh.id} campaignId={campaignId} shift={sh} />
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
                  <RemoveManagerAction
                    campaignId={campaignId}
                    manager={item}
                    ledShifts={
                      ownerIds.has(item.id)
                        ? []
                        : (shiftsByLeader.get(item.id) ?? []).filter((sh) => sh.upcoming)
                    }
                  />
                )
            : undefined
        }
      />
    </CollapsibleCard>
  );
});
