import { useMemo } from 'react';

import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { isOwnerRole } from '@/apis/organization/models/organization';
import type { IMember } from '@/apis/organization/models/organizationMembers';
import { useCampaignManagersList } from './useCampaignManagersList';

/**
 * Who may lead a shift (spec 3.4): the campaign's team, i.e. its creator, its managers and the
 * organization's owners. A campaign not saved yet has no managers, so its creator is the
 * person filling the form.
 */
export function useLeaderOptions(params: {
  organizationId?: string;
  campaignId?: string;
  createdBy?: string;
  /** False defers both requests, e.g. until a dialog opens. */
  enabled?: boolean;
}): IMember[] {
  const { organizationId, campaignId, createdBy, enabled = true } = params;
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId ?? '', page: 1, limit: 100 },
    { enabled: Boolean(organizationId) && enabled },
  );
  const { managers } = useCampaignManagersList(campaignId ?? '', { enabled });
  return useMemo(() => {
    const managerIds = new Set(managers.map((m) => m.id));
    return (membersData?.data?.members ?? []).filter(
      (m) => m.user_id === createdBy || managerIds.has(m.user_id) || isOwnerRole(m.role),
    );
  }, [createdBy, managers, membersData]);
}
