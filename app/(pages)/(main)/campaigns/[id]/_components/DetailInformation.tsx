import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCalendarClock } from 'react-icons/tb';

import { format } from 'date-fns';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { cn } from '@/libs/utils';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import Image from '@/components/ui/AppImage';
import { Pill } from '@/components/ui/Pill';
import { formattedDate } from '@/utils/formattedDate';
import { CampaignDateRange } from '@/components/client/shared/CampaignDateRange';
import { HiMapPin } from 'react-icons/hi2';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import ReportSummaryCard from '@/modules/ReportSummaryCard';

import { STATUS } from '@/constants/status';
import { getDifficultyLevel } from '@/constants/difficulty';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { Link } from '@/libs/router';

import { ParticipationInfoCard } from './ParticipationInfoCard';
import { ShiftFillBar } from './ShiftFillBar';

const DEFAULT_BANNER = '/banner-default.jpg';

const cardClass = cn(
  'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm',
);
export const DetailInformation = memo(function DetailInformation() {
  const { t } = useTranslation('common');
  const { campaign, canManageCampaign } = useCampaignDetail();
  const { title: localizedTitle, description: localizedDescription } =
    useLocalizedDisplay();

  const bannerUrl = useMemo(
    () => (campaign?.banner?.trim() ? campaign.banner : DEFAULT_BANNER),
    [campaign?.banner],
  );

  const displayTitle = useMemo(() => {
    if (!campaign) {
      return t('Campaign');
    }
    const picked = localizedTitle(campaign).trim();
    return picked || t('Campaign');
  }, [campaign, localizedTitle, t]);

  const displayDescription = useMemo(
    () => (campaign ? localizedDescription(campaign) : ''),
    [campaign, localizedDescription],
  );

  const organizationId = campaign?.organization_id ?? '';
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId, page: 1, limit: 100 },
    { enabled: Boolean(organizationId) },
  );
  const memberName = (userId?: string | null) => {
    if (!userId) return null;
    const member = membersData?.data?.members?.find((m) => m.user_id === userId);
    return member?.user?.name || member?.user?.email || null;
  };

  if (!campaign) {
    return null;
  }

  const showCompletionVerification =
    campaign.status === STATUS.WAITING_CONFIRMED ||
    campaign.status === STATUS.COMPLETED;
  const verification = campaign.completion_verification;
  const difficulty = getDifficultyLevel(campaign.difficulty ?? 0);
  const organization = campaign.organization;
  const points = campaign.meeting_points ?? [];
  const pointName = (index: number) =>
    points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 });

  const hhmm = (iso: string) => format(new Date(iso), 'HH:mm');

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className={cardClass}>
        <div className="flex flex-row gap-10">
          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-row items-center justify-between w-full">
              <Pill tone="green">
                {campaign.green_points ?? ''} {t('Reward (GP & SP)')}
              </Pill>
              <span className="font-display-1 text-muted-foreground">
                {formattedDate(campaign?.created_at)}
              </span>
            </div>

            {showCompletionVerification ? (
              <p className="mt-3 font-display-2 text-sm text-foreground-secondary">
                {t('Verification points')}:{' '}
                <span className="font-semibold text-emerald-700">
                  {verification?.clean_count ?? 0} {t('Clean')}
                </span>
                {' · '}
                <span className="font-semibold text-rose-700">
                  {verification?.not_clean_count ?? 0} {t('Not clean')}
                </span>
              </p>
            ) : null}
            <div className="mt-4 text-button-accent font-display-7 font-semibold leading-tight text-foreground sm:mt-3 sm:text-2xl lg:text-3xl">
              {displayTitle}
            </div>

            <div className="font-display-1 text-muted-foreground flex flex-row items-center gap-1 py-2">
              <HiMapPin size={14} />
              <TooltipTruncatedText text={campaign.detail_address ?? '-'} maxLength={90} />
            </div>

            <RichTextContent
              value={displayDescription}
              className="!font-display-2 text-foreground-secondary"
              maxLines={8}
              showMoreLabel={t('See more')}
              showLessLabel={t('See less')}
              emptyFallback={
                <span className="font-display-2 text-foreground-secondary">
                  {t('No description available.')}
                </span>
              }
            />

            <div className="flex flex-row items-center gap-2 text-muted-foreground pt-3">
              <TbCalendarClock size={14} />
              <span className="font-display-1">
                <CampaignDateRange campaign={campaign} />
              </span>
            </div>

            {(organization || difficulty) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-sm">
                {organization && (
                  <span>
                    <span className="text-foreground-tertiary">{t('Organization')}: </span>
                    <Link
                      href={`/organizations/${organization.slug ?? organization.id}`}
                      className="font-medium text-button-accent hover:underline"
                    >
                      {organization.name}
                    </Link>
                  </span>
                )}
                {difficulty && (
                  <span>
                    <span className="text-foreground-tertiary">{t('Difficulty')}: </span>
                    <span className="font-medium">{t(difficulty.label)}</span>
                  </span>
                )}
              </div>
            )}

          </div>

          <div className="w-[300px] h-[100px] flex items-center justify-center">
            <Image
              src={bannerUrl ?? DEFAULT_BANNER}
              alt={displayTitle}
              width={50}
              height={50}
              className="w-[300px] h-[100px] object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      <ParticipationInfoCard campaign={campaign} />

      {points.length > 0 && (
        <div className={cardClass}>
          <h2 className="font-display-6 font-semibold text-button-accent mb-4">
            {t('Meeting points')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {points.map((point, index) => (
              <div
                key={point.id ?? index}
                className="flex flex-col gap-1 rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-4"
              >
                <span className="font-semibold">{pointName(index)}</span>
                {point.detail_address && (
                  <span className="flex items-start gap-1 text-sm text-foreground-secondary">
                    <HiMapPin size={14} className="mt-0.5 shrink-0" />
                    {point.detail_address}
                  </span>
                )}
                <span className="text-xs text-foreground-tertiary">
                  {t('{{n}} waste points', { n: point.report_ids?.length ?? 0 })} ·{' '}
                  {t('within {{km}} km', { km: point.radius_km })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <h2 className="font-display-6 font-semibold text-button-accent mb-4">{t('Shifts')}</h2>
        <div className="flex flex-col gap-5">
          {(campaign.days ?? []).map((day, d) => {
            const shifts = (campaign.shifts ?? [])
              .filter((sh) => sh.day_id === day.id && sh.min_volunteers > 0)
              .sort(
                (a, b) =>
                  new Date(a.start_at).getTime() - new Date(b.start_at).getTime() ||
                  points.findIndex((p) => p.id === a.meeting_point_id) -
                    points.findIndex((p) => p.id === b.meeting_point_id),
              );
            if (shifts.length === 0) return null;
            return (
              <div key={day.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold">
                    {t('Day {{n}}', { n: d + 1 })} · {format(new Date(day.start_at), 'EEEE, PP')}
                  </span>
                  <span className="text-xs text-foreground-tertiary tabular-nums">
                    {hhmm(day.start_at)} – {hhmm(day.end_at)}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shifts.map((sh) => {
                    const pointIndex = points.findIndex((p) => p.id === sh.meeting_point_id);
                    const registered = sh.registered_count ?? 0;
                    const mine = campaign.my_shift_ids?.includes(sh.id);
                    const leader = memberName(sh.leader_user_id);
                    return (
                      <Link
                        key={sh.id}
                        href={`/campaigns/${campaign.id}/shifts/${sh.id}`}
                        className={cn(
                          'flex flex-col gap-1.5 rounded-lg border p-4 text-sm transition-colors hover:border-[#887A47] hover:shadow-sm',
                          mine
                            ? 'border-[#887A47] bg-[#887A47]/10'
                            : 'border-[rgba(136,122,71,0.3)] bg-white/70',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold">{pointName(pointIndex)}</span>
                          {mine && (
                            <span className="shrink-0 rounded-full bg-[#887A47] px-2 py-0.5 text-xs text-white">
                              {t('Your shift')}
                            </span>
                          )}
                        </div>
                        <span className="tabular-nums">
                          {hhmm(sh.start_at)} – {hhmm(sh.end_at)}
                        </span>
                        {sh.gather_at && (
                          <span className="text-xs text-foreground-tertiary">
                            {t('Gathers at {{time}}', { time: hhmm(sh.gather_at) })}
                          </span>
                        )}
                        {leader && (
                          <span className="text-xs text-foreground-tertiary">
                            {t('In charge: {{name}}', { name: leader })}
                          </span>
                        )}
                        {canManageCampaign &&
                          !sh.leader_user_id &&
                          new Date(sh.end_at).getTime() > Date.now() && (
                            <Pill tone="red" className="self-start">
                              {t('Needs a person in charge')}
                            </Pill>
                          )}
                        <ShiftFillBar
                          className="mt-2"
                          registered={registered}
                          min={sh.min_volunteers}
                          max={sh.max_volunteers}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="font-display-6 font-semibold text-button-accent mb-4">{t('Reports')}</h2>
        <div className="sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-3">
          {campaign?.reports?.map((report) => (
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
    </div>
  );
});
