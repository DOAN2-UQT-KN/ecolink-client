'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCalendarClock } from 'react-icons/tb';

import { Progress } from '@/components/ui/progress';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { cn } from '@/libs/utils';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import Image from 'next/image';
import { Tag } from '@/components/client/shared/Tag';
import { formattedDate } from '@/utils/formattedDate';
import { HiMapPin } from 'react-icons/hi2';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import ReportSummaryCard from '@/modules/ReportSummaryCard';

import { STATUS } from '@/constants/status';

const DEFAULT_BANNER = '/banner-default.jpg';

const cardClass = cn(
  'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm',
);
export const DetailInformation = memo(function DetailInformation() {
  const { t } = useTranslation('common');
  const { campaign, currentMembers, maxMembers, memberProgress, handleJoinCampaign } =
    useCampaignDetail();
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

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className={cardClass}>
        <div className="flex flex-row gap-10">
          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-row items-center justify-between w-full">
              <Tag variant="green">
                {campaign.green_points ?? ''} {t('Reward (GP & SP)')}
              </Tag>
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
                {formattedDate(campaign?.start_date)} - {formattedDate(campaign?.end_date)}
              </span>
            </div>

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

      <div className={cardClass}>
        <h2 className="font-display-6 font-semibold text-button-accent mb-4">
          {t('Current members')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between font-display-1 text-button-accent">
            <span>{t('Members')}</span>
            <span>
              {currentMembers} / {maxMembers > 0 ? maxMembers : t('Not available')}
            </span>
          </div>
          <Progress
            value={memberProgress}
            className="h-2 bg-button-accent/10 [&>[data-slot=progress-indicator]]:bg-button-accent"
          />
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
