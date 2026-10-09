import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Inbox } from 'lucide-react';

import { useGetCampaignRegistrations } from '@/apis/campaign/registration';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { useParams, useRouter } from '@/libs/router';
import useAuthStore from '@/stores/useAuthStore';
import { SosButton } from '@/components/sos/SosButton';
import { ShiftHazardBanner } from '@/components/sos/ShiftHazardBanner';
import { ShiftResultPanel } from '../../_components/ShiftResultPanel';
import { ShiftReopenedPill, ShiftStatusPill } from '@/modules/CampaignVerification';

import { CloseShiftButton } from '../../_components/CloseShiftButton';
import { JoinShiftsCta } from '../../_components/JoinShiftsCta';
import { CampaignDetailProvider } from '../../_context/CampaignDetailContext';
import { useCampaignDetail } from '../../_hooks/useCampaignDetail';
import { cardClass, ShiftInfoTab } from './_components/ShiftInfoTab';
import { ShiftMembersTab } from './_components/ShiftMembersTab';
import { dayLabel, hhmm, meetingPointName } from '@/utils/campaignLabels';


/** One shift of a campaign: its details and who is in charge (tab 1), who registered (tab 2). */
function ShiftDetailBody({ shiftId }: { shiftId: string }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { title: localizedTitle } = useLocalizedDisplay();
  const {
    campaignId,
    campaign,
    isLoading,
    isError,
    canManageCampaign,
    isRegistered,
    hasOpenShift,
    isPlatformAdmin,
    canViewVolunteers,
  } = useCampaignDetail();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<'info' | 'members' | 'result'>('info');

  const shift = campaign?.shifts?.find((s) => s.id === shiftId && s.min_volunteers > 0);
  const points = campaign?.meeting_points ?? [];
  const pointIndex = shift ? points.findIndex((p) => p.id === shift.meeting_point_id) : -1;
  const point = pointIndex >= 0 ? points[pointIndex] : undefined;
  const pointName = meetingPointName(point, pointIndex, t);
  const dayIndex = shift ? (campaign?.days ?? []).findIndex((d) => d.id === shift.day_id) : -1;
  const mine = Boolean(shift && campaign?.my_shift_ids?.includes(shift.id));

  const leaderId = shift?.leader_user_id ?? null;
  const isLeader = leaderId != null && leaderId === currentUserId;

  const { data: registrationsData, isLoading: isMembersLoading } = useGetCampaignRegistrations(
    campaignId,
    { enabled: Boolean(campaignId && shift) && canViewVolunteers },
  );
  const registrations = registrationsData?.data?.shifts?.find((s) => s.shift_id === shiftId);
  const started = shift ? new Date(shift.start_at).getTime() <= Date.now() : false;

  const reports = useMemo(() => {
    const ids = new Set(point?.report_ids ?? []);
    return (campaign?.reports ?? []).filter((r) => ids.has(r.id));
  }, [campaign?.reports, point?.report_ids]);

  const campaignTitle = campaign ? localizedTitle(campaign).trim() || t('Campaign') : t('Campaign');
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: t('Home'), path: '/', type: 'link' },
    { label: t('Campaigns'), path: '/campaigns', type: 'link' },
    { label: campaignTitle, path: `/campaigns/${campaignId}`, type: 'link' },
    {
      label: shift ? `${pointName} · ${format(new Date(shift.start_at), 'dd/MM')}` : t('Shift'),
      path: `/campaigns/${campaignId}/shifts/${shiftId}`,
      type: 'page',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 space-y-4 pt-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !campaign || !shift) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('Shift not found')}</EmptyTitle>
              <EmptyDescription>
                {t("We couldn't find the shift you were looking for.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  const day = campaign.days?.[dayIndex];
  const canClose =
    canManageCampaign &&
    !started &&
    (campaign.shifts ?? []).some(
      (s) => s.day_id === shift.day_id && s.id !== shift.id && s.min_volunteers > 0,
    );

  const canSeeAttendance =
    (canManageCampaign || isPlatformAdmin || isLeader) &&
    new Date(shift.start_at).getTime() - 60 * 60 * 1000 <= Date.now();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display-7 font-semibold !text-button-accent">{pointName}</h2>
              {shift.status && <ShiftStatusPill status={shift.status} />}
              {shift.reopened_at && <ShiftReopenedPill reason={shift.reopen_reason} />}
              {mine && <Pill tone="brand">{t('Your shift')}</Pill>}
            </div>
            <span className="font-display-1 text-foreground-secondary">
              {day ? `${dayLabel(day, dayIndex, t)} · ` : ''}
              <span className="tabular-nums">
                {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {/* SOS from the shift screen: its checked-in volunteers and its leader (spec 4.3). */}
          {shift.status === 'running' && <SosButton campaignId={campaignId} shiftId={shift.id} />}
          {canClose && (
            <CloseShiftButton
              campaignId={campaignId}
              shiftId={shift.id}
              registered={shift.registered_count ?? 0}
              onClosed={() => router.push(`/campaigns/${campaignId}`)}
            />
          )}
          <JoinShiftsCta
            campaignId={campaignId}
            isRegistered={isRegistered}
            canJoin={hasOpenShift && !canManageCampaign}
            returnTo={`/campaigns/${campaignId}/shifts/${shiftId}`}
          />
          </div>
        </div>

        {shift.status === 'running' &&
          point &&
          (mine || canManageCampaign || isPlatformAdmin || isLeader) && (
            <ShiftHazardBanner campaignId={campaignId} meetingPoint={point} />
          )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'info' | 'members' | 'result')}>
          <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
            {(
              [
                ['info', t('Information')],
                ['members', t('Members & attendance')],
                ['result', t('Result')],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="info" className="mt-0 flex flex-col gap-4 sm:gap-5">
            <ShiftInfoTab shift={shift} point={point} pointName={pointName} reports={reports} />
          </TabsContent>

          <TabsContent value="result" className="mt-0 flex flex-col gap-4 sm:gap-5">
            <ShiftResultPanel className={cardClass} campaignId={campaignId} shiftId={shift.id} reports={reports} />
          </TabsContent>

          <TabsContent value="members" className="mt-0 flex flex-col gap-4 sm:gap-5">
            <ShiftMembersTab
              shift={shift}
              registrations={registrations}
              isLoading={isMembersLoading}
              canSeeAttendance={canSeeAttendance}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ShiftDetailPage() {
  const { id = '', shiftId = '' } = useParams() as { id?: string; shiftId?: string };
  return (
    <CampaignDetailProvider campaignId={id}>
      <ShiftDetailBody shiftId={shiftId} />
    </CampaignDetailProvider>
  );
}
