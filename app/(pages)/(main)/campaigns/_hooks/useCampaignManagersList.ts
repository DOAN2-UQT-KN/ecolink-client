import { useMemo } from 'react';

import { useGetCampaignManager } from '@/apis/campaign/campaignManager';

/**
 * The campaign's managers in assignment order. Every campaign screen uses these exact params so
 * they share one cached request.
 */
export function useCampaignManagersList(campaignId: string, options?: { enabled?: boolean }) {
  const query = useGetCampaignManager(
    { campaignId, limit: 100, sortBy: 'assignedAt', sortOrder: 'asc' },
    { enabled: Boolean(campaignId) && (options?.enabled ?? true) },
  );
  const raw = query.data?.data?.managers;
  const managers = useMemo(
    () => (raw ?? []).map((m) => ({ id: m.user_id, avatar: m.avatar, name: m.name })),
    [raw],
  );
  return { managers, query };
}
