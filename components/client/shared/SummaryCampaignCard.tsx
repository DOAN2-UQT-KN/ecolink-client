import type { ICampaign } from '@/apis/campaign/models/campaign';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { Tag } from './Tag';
import { HiMapPin } from 'react-icons/hi2';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import { formattedDate } from '@/utils/formattedDate';
import { TbCalendarClock, TbArrowRight } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface SummaryCampaignCardProps {
  campaign: ICampaign;
}

export default function SummaryCampaignCard({ campaign }: SummaryCampaignCardProps) {
  const { t } = useTranslation('common');
  const maxMembers = 50;
  const currentMembers = 18;
  const memberProgress = (currentMembers / maxMembers) * 100;

  return (
    <article className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm flex flex-row gap-5 items-center">
      <Image
        src={campaign.banner ?? '/banner-default.jpg'}
        alt={campaign.title}
        className="w-[300px] h-[300px] rounded-lg object-cover"
        width={300}
        height={300}
      />

      <div className="space-y-5 flex flex-col w-[calc(100%-300px)]">
        <div className="flex flex-row items-center justify-between w-full">
          <Tag variant="green">
            {campaign.green_points ?? ''} {t('Green points')}
          </Tag>
          <span className="font-display-1 text-muted-foreground">
            {formattedDate(campaign?.created_at)}
          </span>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <h3 className="font-semibold text-button-accent font-display-6">{campaign.title}</h3>
          <div className="font-display-1 text-muted-foreground flex flex-row items-center gap-1">
            <HiMapPin size={14} />
            <TooltipTruncatedText text={campaign.detail_address ?? '-'} maxLength={50} />
          </div>
        </div>

        <p className="font-display-1 text-foreground-secondary">
          {campaign.description ?? t('No description available.')}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between font-display-1 text-button-accent">
            <span>{t('Member enrollment')}</span>
            <span className="font-display-1">
              {currentMembers} / {maxMembers}
            </span>
          </div>
          <Progress
            value={memberProgress}
            className="h-2 bg-button-accent/10 [&>[data-slot=progress-indicator]]:bg-button-accent"
          />
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <TbCalendarClock size={14} />
            <span className="font-display-1">
              {formattedDate(campaign?.start_date)} - {formattedDate(campaign?.end_date)}
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
