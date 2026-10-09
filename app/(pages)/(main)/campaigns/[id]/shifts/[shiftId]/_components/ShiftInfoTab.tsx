import { useTranslation } from 'react-i18next';
import { HiMapPin } from 'react-icons/hi2';

import type { IMeetingPoint, ICampaignShift } from '@/apis/campaign/models/lifecycle';
import type { IIncident } from '@/apis/incident/models/incident';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { AvatarList } from '@/components/client/shared/AvatarList';
import { Pill } from '@/components/ui/Pill';
import ReportSummaryCard from '@/modules/ReportSummaryCard';
import { ChangeShiftLeaderButton } from '../../../_components/ChangeShiftLeaderButton';
import { ShiftFillBar } from '../../../_components/ShiftFillBar';
import { useCampaignDetail } from '../../../_hooks/useCampaignDetail';
import { useCampaignManagersList } from '../../../../_hooks/useCampaignManagersList';
import { hhmm } from '../../../../_services/campaignLabels';

export const cardClass = 'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm';

/** "Information" tab: who is in charge, the shift's times and its meeting point. */
export function ShiftInfoTab({
  shift,
  point,
  pointName,
  reports,
}: {
  shift: ICampaignShift;
  point: IMeetingPoint | undefined;
  pointName: string;
  reports: IIncident[];
}) {
  const { t } = useTranslation('common');
  const { campaignId, campaign, canManageCampaign } = useCampaignDetail();

  const { managers } = useCampaignManagersList(campaignId);
  const leaderId = shift.leader_user_id ?? null;
  const leaderIsManager = managers.some((m) => m.id === leaderId);
  const organizationId = campaign?.organization_id ?? '';
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId, page: 1, limit: 100 },
    { enabled: Boolean(organizationId && leaderId && !leaderIsManager) },
  );
  const leader = leaderIsManager
    ? managers.find((m) => m.id === leaderId)
    : (() => {
        const member = membersData?.data?.members?.find((m) => m.user_id === leaderId);
        return member
          ? { id: member.user_id, avatar: member.user?.avatar, name: member.user?.name || member.user?.email }
          : null;
      })();
  const otherManagers = managers.filter((m) => m.id !== leaderId);
  const creatorId = campaign?.created_by ?? campaign?.owner?.id;
  // Ended early (spec 4.2): `ended_at` is the actual end.
  const ended = new Date(shift.ended_at ?? shift.end_at).getTime() <= Date.now();

  return (
    <>
      <div className={cardClass}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display-6 font-semibold text-button-accent">
            {t('Person in charge')}
          </h2>
          {canManageCampaign && !ended && (
            <ChangeShiftLeaderButton
              campaignId={campaignId}
              shiftId={shift.id}
              organizationId={organizationId}
              createdBy={creatorId}
              leaderUserId={leaderId}
            />
          )}
        </div>
        {leader ? (
          <AvatarList isLoading={false} items={[leader]} />
        ) : leaderId ? (
          <p className="text-sm text-foreground-tertiary">—</p>
        ) : (
          <Pill tone="red">{t('Needs a person in charge')}</Pill>
        )}
        {otherManagers.length > 0 && (
          <>
            <h3 className="mt-4 mb-1 text-sm font-semibold text-foreground-tertiary">
              {t('Other managers')}
            </h3>
            <AvatarList
              isLoading={false}
              items={otherManagers}
              renderBadge={(item) =>
                item.id === creatorId ? <Pill tone="brand">{t('Creator')}</Pill> : null
              }
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="font-display-6 font-semibold text-button-accent mb-4">{t('Shift')}</h2>
          <div className="flex flex-col gap-2 text-sm">
            <span>
              <span className="text-foreground-tertiary">{t('Shift time')}: </span>
              <span className="font-medium tabular-nums">
                {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
              </span>
            </span>
            {shift.gather_at && (
              <span>
                <span className="text-foreground-tertiary">{t('Gathering time')}: </span>
                <span className="font-medium tabular-nums">{hhmm(shift.gather_at)}</span>
              </span>
            )}
            {shift.ended_at && (
              <span>
                <span className="text-foreground-tertiary">{t('Ended early at')}: </span>
                <span className="font-medium tabular-nums">{hhmm(shift.ended_at)}</span>
              </span>
            )}
            <ShiftFillBar
              className="mt-2"
              registered={shift.registered_count ?? 0}
              min={shift.min_volunteers}
              max={shift.max_volunteers}
            />
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="font-display-6 font-semibold text-button-accent mb-4">
            {t('Meeting point')}
          </h2>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">{pointName}</span>
            {point?.detail_address && (
              <span className="flex items-start gap-1 text-foreground-secondary">
                <HiMapPin size={14} className="mt-0.5 shrink-0" />
                {point.detail_address}
              </span>
            )}
            <span className="text-xs text-foreground-tertiary">
              {t('{{n}} waste points', { n: point?.report_ids?.length ?? 0 })} ·{' '}
              {t('within {{km}} km', { km: point?.radius_km })}
            </span>
          </div>
        </div>
      </div>

      {reports.length > 0 && (
        <div className={cardClass}>
          <h2 className="font-display-6 font-semibold text-button-accent mb-4">
            {t('Waste points at this meeting point')}
          </h2>
          <div className="sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportSummaryCard
                enabledCheckbox={false}
                key={report.id}
                incident={report}
                selectedReports={[]}
                setSelectedReports={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
