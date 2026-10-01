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

const DEFAULT_BANNER = '/banner-default.jpg';

const cardClass = cn(
  'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm',
);
export const DetailInformation = memo(function DetailInformation() {
  const { t } = useTranslation('common');
  const { campaign, currentMembers } = useCampaignDetail();
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
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display-6 font-semibold text-button-accent">{t('Shifts')}</h2>
          <span className="font-display-1 text-button-accent">
            {t('{{n}} volunteers registered', { n: currentMembers })}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {(campaign?.days ?? []).map((day, d) => {
            const shifts = (campaign?.shifts ?? [])
              .filter((sh) => sh.day_id === day.id && sh.min_volunteers > 0)
              .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            if (shifts.length === 0) return null;
            return (
              <div key={day.id} className="flex flex-col gap-2">
                <div className="text-sm font-semibold">
                  {t('Day {{n}}', { n: d + 1 })} · {format(new Date(day.start_at), 'EEEE, PP')}
                </div>
                <ul className="flex flex-col gap-1">
                  {shifts.map((sh) => {
                    const pointIndex = (campaign?.meeting_points ?? []).findIndex(
                      (p) => p.id === sh.meeting_point_id,
                    );
                    const point = campaign?.meeting_points?.[pointIndex];
                    const registered = sh.registered_count ?? 0;
                    const short = Math.max(0, sh.min_volunteers - registered);
                    const mine = campaign?.my_shift_ids?.includes(sh.id);
                    return (
                      <li
                        key={sh.id}
                        className={cn(
                          'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2 text-sm',
                          mine ? 'bg-[#887A47]/10' : 'bg-white/60',
                        )}
                      >
                        <span className="font-medium">
                          {point?.name || t('Meeting point {{n}}', { n: pointIndex + 1 })}
                        </span>
                        <span className="text-xs text-foreground-tertiary tabular-nums">
                          {format(new Date(sh.start_at), 'HH:mm')} –{' '}
                          {format(new Date(sh.end_at), 'HH:mm')}
                        </span>
                        {mine && (
                          <span className="rounded-full bg-[#887A47] px-2 py-0.5 text-xs text-white">
                            {t('Your shift')}
                          </span>
                        )}
                        <span className="ml-auto tabular-nums">
                          {registered} / {sh.min_volunteers}
                          {sh.max_volunteers != null ? ` – ${sh.max_volunteers}` : '+'}
                        </span>
                        {short > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {t('{{n}} more needed', { n: short })}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
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
