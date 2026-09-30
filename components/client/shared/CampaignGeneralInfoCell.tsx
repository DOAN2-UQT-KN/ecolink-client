import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import Image from '@/components/ui/AppImage';
import { getDifficultyLevel } from '@/constants/difficulty';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';

const DEFAULT_BANNER = '/banner-default.jpg';

/** Banner thumbnail, title, schedule and difficulty of a campaign, for table rows. */
export const CampaignGeneralInfoCell = memo(function CampaignGeneralInfoCell({
  campaign,
  title,
}: {
  campaign: ICampaign;
  /** Already localized. */
  title: string;
}) {
  const { t } = useTranslation();
  const bannerUrl = campaign.banner?.trim() ? campaign.banner : DEFAULT_BANNER;
  const difficulty = getDifficultyLevel(campaign.difficulty);
  const duration = `${formattedDate(campaign.start_date ?? undefined)} - ${formattedDate(campaign.end_date ?? undefined)}`;

  return (
    <div className="flex items-start gap-3 min-w-[280px] max-w-[420px]">
      <Image
        src={bannerUrl}
        alt={title}
        width={72}
        height={48}
        className="h-12 w-[72px] shrink-0 rounded-md object-cover ring-1 ring-zinc-200"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium line-clamp-2 text-zinc-900">{title}</span>
        <span className="text-xs text-zinc-600 tabular-nums">{duration}</span>
        <span
          className={cn(
            'font-display-1 text-xs font-medium',
            difficulty?.textClass ?? 'text-zinc-500',
          )}
        >
          {difficulty ? t(difficulty.label) : '—'}
        </span>
      </div>
    </div>
  );
});

export default CampaignGeneralInfoCell;
