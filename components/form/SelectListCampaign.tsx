'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetAllCampaigns } from '@/apis/campaign/getCampaigns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export const ALL_CAMPAIGNS_VALUE = '-1';

interface SelectListCampaignProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** When true, prepends an "All" option with value "-1". Default: false. */
  allOptions?: boolean;
}

const SelectListCampaign = memo(function SelectListCampaign({
  value,
  onChange,
  disabled = false,
  allOptions = false,
  ...props
}: SelectListCampaignProps) {
  const { t } = useTranslation();

  const params = useMemo(() => ({ page: 1, limit: 100 }), []);

  const { data, isLoading } = useGetAllCampaigns(params, { staleTime: 60_000 });

  const campaigns = useMemo(() => data?.data?.campaigns ?? [], [data?.data?.campaigns]);

  if (isLoading) {
    return <Skeleton className="h-[50px] w-full rounded-md" />;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        {...props}
      >
        <SelectValue placeholder={t('Select campaign...')} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {allOptions && (
          <SelectItem value={ALL_CAMPAIGNS_VALUE}>
            <span className="text-sm">{t('All campaigns')}</span>
          </SelectItem>
        )}
        {campaigns.map((campaign) => (
          <SelectItem key={campaign.id} value={campaign.id}>
            <span className="text-sm">{campaign.title}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default SelectListCampaign;
