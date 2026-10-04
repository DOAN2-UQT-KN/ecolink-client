import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCalendarClock } from 'react-icons/tb';

import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { RichTextContent } from '@/components/ui/RichTextContent';

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
import { Link } from '@/libs/router';

import { ParticipationInfoCard } from './ParticipationInfoCard';
import { CampaignManagers } from './CampaignManagers';
import { ShiftProgressCard } from './ShiftProgressCard';
import { ADMIN_ROLE_ID } from '@/constants/roles';
import useAuthStore from '@/stores/useAuthStore';

const DEFAULT_BANNER = '/banner-default.jpg';

export const DetailInformation = memo(function DetailInformation() {
  const { t } = useTranslation('common');
  const { campaign, canManageCampaign } = useCampaignDetail();
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);
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

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <CollapsibleCard title={t('Overview')}>
        <div className="flex flex-row gap-10">
          <div className="flex min-w-0 flex-1 flex-col">
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
      </CollapsibleCard>

      <ParticipationInfoCard campaign={campaign} />

      {/* Spec 4.2: every shift's status and the totals, for managers and admins. */}
      {(canManageCampaign || isPlatformAdmin) && (campaign.shifts?.length ?? 0) > 0 && (
        <ShiftProgressCard campaign={campaign} />
      )}

      <CampaignManagers />

      {points.length > 0 && (
        <CollapsibleCard title={t('Meeting points')}>
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
        </CollapsibleCard>
      )}

      <CollapsibleCard title={t('Reports')}>
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
      </CollapsibleCard>
    </div>
  );
});
