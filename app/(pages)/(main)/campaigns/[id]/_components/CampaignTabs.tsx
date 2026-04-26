'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetJoinRequests } from '@/apis/campaign/joinCampaign';
import type { IGetJoinCampaignRequest } from '@/apis/campaign/models/joinCampaign';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATUS } from '@/constants/status';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

import { CampaignJoinRequest } from './CampaignJoinRequest';
import { CampaignTask } from './CampaignTask';
import { CurrentMember } from './CurrentMember';
import { DetailInformation } from './DetailInformation';

function formatApprovalRequestBadgeCount(total: number): string {
  if (total >= 9) return '9+';
  return String(total);
}

const ALL_CAMPAIGN_TAB_ITEMS = [
  { value: 'detail', labelKey: 'Detail Information' },
  { value: 'members', labelKey: 'Member List' },
  { value: 'tasks', labelKey: 'Tasks' },
  { value: 'join-requests', labelKey: 'Join requests' },
] as const;

export type CampaignTabValue = (typeof ALL_CAMPAIGN_TAB_ITEMS)[number]['value'];

const CAMPAIGN_TAB_ITEMS_PUBLIC = ALL_CAMPAIGN_TAB_ITEMS.filter(
  (item) => item.value !== 'join-requests',
);

export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation('common');
  const { campaignId, isCampaignOwner } = useCampaignDetail();
  const [tab, setTab] = useState<CampaignTabValue>('detail');

  const joinRequestsCountQuery = useMemo((): IGetJoinCampaignRequest => {
    return {
      campaignId: campaignId,
      page: 1,
      limit: 50,
      status: STATUS.PENDING,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
  }, [campaignId]);

  const { data: joinRequestsData } = useGetJoinRequests(joinRequestsCountQuery, {
    enabled: isCampaignOwner && Boolean(campaignId),
  });

  const pendingApprovalCount = joinRequestsData?.data?.total ?? 0;

  const tabItems = useMemo(() => {
    return isCampaignOwner ? [...ALL_CAMPAIGN_TAB_ITEMS] : [...CAMPAIGN_TAB_ITEMS_PUBLIC];
  }, [isCampaignOwner]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as CampaignTabValue)}>
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
        {tabItems.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {t(item.labelKey)}
              {item.value === 'join-requests' && pendingApprovalCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="min-w-5 px-1.5 tabular-nums border-red-500 bg-red-100 text-red-500"
                >
                  {formatApprovalRequestBadgeCount(pendingApprovalCount)}
                </Badge>
              ) : null}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="detail" className="mt-0">
        <DetailInformation />
      </TabsContent>
      <TabsContent value="members" className="mt-0">
        <CurrentMember />
      </TabsContent>
      <TabsContent value="tasks" className="mt-0">
        <CampaignTask />
      </TabsContent>
      <TabsContent value="join-requests" className="mt-0">
        <CampaignJoinRequest enabled={tab === 'join-requests'} />
      </TabsContent>
    </Tabs>
  );
});
