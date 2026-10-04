import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Inbox } from 'lucide-react';
import { HiMapPin } from 'react-icons/hi2';
import { TbArrowRight, TbPencil } from 'react-icons/tb';

import { useGetCampaignManager } from '@/apis/campaign/campaignManager';
import { useGetCampaignRegistrations } from '@/apis/campaign/registration';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/client/shared/Button';
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
import { ADMIN_ROLE_ID } from '@/constants/roles';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { useParams, useRouter } from '@/libs/router';
import { cn } from '@/libs/utils';
import ReportSummaryCard from '@/modules/ReportSummaryCard';
import useAuthStore from '@/stores/useAuthStore';
import { ShiftAttendancePanel } from '../../_components/ShiftAttendancePanel';

import { AvatarList } from '../../_components/AvatarList';
import { ChangeShiftLeaderButton } from '../../_components/ChangeShiftLeaderButton';
import { CloseShiftButton } from '../../_components/CloseShiftButton';
import { JoinShiftsDialog } from '../../_components/JoinShiftsDialog';
import { ShiftFillBar } from '../../_components/ShiftFillBar';
import { CampaignDetailProvider } from '../../_context/CampaignDetailContext';
import { useCampaignDetail } from '../../_hooks/useCampaignDetail';

const cardClass = 'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm';
const hhmm = (iso: string) => format(new Date(iso), 'HH:mm');

/** One shift of a campaign: its details and who is in charge (tab 1), who registered (tab 2). */
function ShiftDetailBody({ shiftId }: { shiftId: string }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { title: localizedTitle } = useLocalizedDisplay();
  const { campaignId, campaign, isLoading, isError, canManageCampaign, isRegistered, hasOpenShift } =
    useCampaignDetail();
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<'info' | 'members'>('info');
  const [joinOpen, setJoinOpen] = useState(false);

  const shift = campaign?.shifts?.find((s) => s.id === shiftId && s.min_volunteers > 0);
  const points = campaign?.meeting_points ?? [];
  const pointIndex = shift ? points.findIndex((p) => p.id === shift.meeting_point_id) : -1;
  const point = pointIndex >= 0 ? points[pointIndex] : undefined;
  const pointName = point?.name || t('Meeting point {{n}}', { n: pointIndex + 1 });
  const dayIndex = shift ? (campaign?.days ?? []).findIndex((d) => d.id === shift.day_id) : -1;
  const mine = Boolean(shift && campaign?.my_shift_ids?.includes(shift.id));

  const { data: managerData } = useGetCampaignManager(
    { campaignId, limit: 100, sortBy: 'assignedAt', sortOrder: 'asc' },
    { enabled: Boolean(campaignId) },
  );
  const managers = (managerData?.data?.managers ?? []).map((m) => ({
    id: m.user_id,
    avatar: m.avatar,
    name: m.name,
  }));
  const leaderId = shift?.leader_user_id ?? null;
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

  // Server returns 403 for anyone else, so don't ask.
  const canViewVolunteers = canManageCampaign || isRegistered || isPlatformAdmin;
  const { data: registrationsData, isLoading: isMembersLoading } = useGetCampaignRegistrations(
    campaignId,
    { enabled: Boolean(campaignId && shift) && canViewVolunteers },
  );
  const registrations = registrationsData?.data?.shifts?.find((s) => s.shift_id === shiftId);
  const started = shift ? new Date(shift.start_at).getTime() <= Date.now() : false;
  const ended = shift ? new Date(shift.end_at).getTime() <= Date.now() : false;

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

  const openJoin = () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/campaigns/${campaignId}/shifts/${shiftId}`)}`);
      return;
    }
    setJoinOpen(true);
  };

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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display-7 font-semibold !text-button-accent">{pointName}</h2>
              {mine && <Pill tone="brand">{t('Your shift')}</Pill>}
            </div>
            <span className="font-display-1 text-foreground-secondary">
              {day ? `${t('Day {{n}}', { n: dayIndex + 1 })} · ${format(new Date(day.start_at), 'EEEE, PP')} · ` : ''}
              <span className="tabular-nums">
                {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {canClose && (
            <CloseShiftButton
              campaignId={campaignId}
              shiftId={shift.id}
              registered={shift.registered_count ?? 0}
              onClosed={() => router.push(`/campaigns/${campaignId}`)}
            />
          )}
          {isRegistered ? (
            <Button
              type="button"
              variant="outlined-brown"
              size="medium"
              iconLeft={<TbPencil className="size-4" aria-hidden />}
              onClick={openJoin}
            >
              {t('Edit my shifts')}
            </Button>
          ) : hasOpenShift && !canManageCampaign ? (
            <Button
              type="button"
              variant="brown"
              size="medium"
              iconRight={<TbArrowRight className="size-4" aria-hidden />}
              onClick={openJoin}
            >
              {t('Join')}
            </Button>
          ) : null}
          </div>
        </div>
        <JoinShiftsDialog campaignId={campaignId} open={joinOpen} onOpenChange={setJoinOpen} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'info' | 'members')}>
          <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
            {(
              [
                ['info', t('Information')],
                ['members', t('Members')],
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
            {/* Attendance (spec 4.1): the leader, managers and admins, from an hour before the shift. */}
            {(canManageCampaign || isPlatformAdmin || (leaderId != null && leaderId === currentUserId)) &&
              new Date(shift.start_at).getTime() - 60 * 60 * 1000 <= Date.now() && (
                <ShiftAttendancePanel
                  className={cardClass}
                  campaignId={campaignId}
                  shiftId={shift.id}
                  registered={registrations?.volunteers ?? []}
                />
              )}
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
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <div className={cardClass}>
              {!canViewVolunteers ? (
                <p className="text-sm text-foreground-tertiary">
                  {t('Only managers and registered volunteers can see the volunteer list.')}
                </p>
              ) : isMembersLoading ? (
                <AvatarList isLoading items={[]} />
              ) : !registrations || registrations.volunteers.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">{t('Nobody has registered yet')}</p>
              ) : (
                <>
                  <ShiftFillBar
                    className="mb-4 max-w-sm"
                    registered={registrations.registered_count}
                    min={registrations.min_volunteers}
                    max={registrations.max_volunteers}
                  />
                  <AvatarList
                    isLoading={false}
                    showAttendance={started}
                    items={registrations.volunteers.map((v) => ({
                      id: v.user_id,
                      avatar: v.volunteer?.avatar,
                      name: v.volunteer?.name,
                      checkedIn: Boolean(v.checked_in_at),
                    }))}
                    renderBadge={(item) => {
                      const v = registrations.volunteers.find((x) => x.user_id === item.id);
                      if (!v) return null;
                      return (
                        <div className={cn('flex flex-wrap items-center gap-1.5')}>
                          <span className="text-xs text-foreground-tertiary">
                            {t('Registered')} {format(new Date(v.registered_at), 'PPp')}
                          </span>
                        </div>
                      );
                    }}
                  />
                </>
              )}
            </div>
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
