import type { ICampaign } from '@/apis/campaign/models/campaign';
import Image from '@/components/ui/AppImage';
import { HiMapPin } from 'react-icons/hi2';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { formattedDate } from '@/utils/formattedDate';
import { CampaignDateRange } from '@/components/client/shared/CampaignDateRange';
import { TbCalendarClock, TbArrowRight } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Button } from './Button';
import { useRouter } from '@/libs/router';
import useAuthStore from '@/stores/useAuthStore';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pill } from '@/components/ui/Pill';

interface SummaryCampaignCardProps {
  campaign: ICampaign;
  exploreMode?: boolean;
}

export default function SummaryCampaignCard({
  campaign,
  exploreMode = false,
}: SummaryCampaignCardProps) {
  const { t } = useTranslation('common');
  const { title: localizedTitle, description: localizedDescription } =
    useLocalizedDisplay();
  const displayTitle = localizedTitle(campaign);
  const displayDescription = localizedDescription(campaign);
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const showYourCampaignTag =
    campaign.owner?.id != null && currentUserId != null && campaign.owner.id === currentUserId;
  return (
    <article
      onClick={() => {
        router.push(`/campaigns/${campaign.id}`);
      }}
      className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm flex flex-row gap-5 items-center"
    >
      <Image
        src={campaign.banner ?? '/banner-default.jpg'}
        alt={displayTitle}
        className="w-[300px] h-[300px] rounded-lg object-cover"
        width={300}
        height={300}
      />

      <div className="space-y-5 flex flex-col w-[calc(100%-300px)]">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row items-center gap-2">
            <Pill tone="green">
              {campaign.green_points ?? ''} {t('Reward (GP & SP)')}
            </Pill>
            {showYourCampaignTag ? (
              <Pill tone="brand" aria-label={t('Your campaign')}>
                {t('Your Campaign')}
              </Pill>
            ) : null}
          </div>
          <span className="font-display-1 text-muted-foreground">
            {formattedDate(campaign?.created_at)}
          </span>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <div className="flex flex-row items-center gap-3 w-full">
            <h3 className="font-semibold text-button-accent font-display-6">{displayTitle}</h3>
            {campaign.status != null ? (
              <div onClick={(e) => e.stopPropagation()}>
                <StatusPill type={campaign.status} />
              </div>
            ) : null}
          </div>
          <div className="font-display-1 text-muted-foreground flex flex-row items-center gap-1">
            <HiMapPin size={14} />
            <TooltipTruncatedText text={campaign.detail_address ?? '-'} maxLength={50} />
          </div>
        </div>

        {exploreMode && campaign.organization ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const slug = campaign.organization?.slug;
                  if (!slug) return;
                  router.push(`/organizations/${slug}`);
                }}
                className="w-fit flex items-center gap-2 rounded-md border border-[rgba(136,122,71,0.35)] bg-white/80 px-2 py-1.5 hover:bg-white cursor-pointer"
                aria-label={t('View organization')}
              >
                {campaign.organization.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary logo URLs
                  <img
                    src={campaign.organization.logo_url}
                    alt={campaign.organization.name}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-6 rounded-full bg-muted" aria-hidden />
                )}
                <span className="font-display-1 text-foreground-secondary">
                  {campaign.organization.name}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('View organization')}</TooltipContent>
          </Tooltip>
        ) : null}

        <RichTextContent
          value={displayDescription}
          className="!font-display-1 text-foreground-secondary"
          maxLines={4}
          showMoreLabel={t('See more')}
          showLessLabel={t('See less')}
          emptyFallback={
            <span className="font-display-1 text-foreground-secondary">
              {t('No description available.')}
            </span>
          }
        />

        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <TbCalendarClock size={14} />
            <span className="font-display-1">
              <CampaignDateRange campaign={campaign} />
            </span>
          </div>

          <Button variant="outlined-brown" size="small" className="!h-[35px]">
            <div className="flex flex-row items-center gap-2">
              {t('Join campaign')}
              <TbArrowRight size={14} />
            </div>
          </Button>
        </div>
      </div>
    </article>
  );
}
