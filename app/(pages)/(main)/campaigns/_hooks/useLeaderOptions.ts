import { useMemo } from 'react';

import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { isOwnerRole } from '@/apis/organization/models/organization';
import type { IMember } from '@/apis/organization/models/organizationMembers';
import { useGetCampaignManager } from '@/apis/campaign/campaignManager';

/**
 * Who may lead a shift (spec 3.4): the campaign's team, i.e. its creator, its managers and the
 * organization's owners. A campaign not saved yet has no managers, so its creator is the
 * person filling the form.
 */
export function useLeaderOptions(params: {
  organizationId?: string;
  campaignId?: string;
  createdBy?: string;
}): IMember[] {
  const { organizationId, campaignId, createdBy } = params;
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId ?? '', page: 1, limit: 100 },
    { enabled: Boolean(organizationId) },
  );
  const { data: managersData } = useGetCampaignManager(
    { campaignId: campaignId ?? '', page: 1, limit: 100 },
    { enabled: Boolean(campaignId) },
  );
  return useMemo(() => {
    const managerIds = new Set((managersData?.data?.managers ?? []).map((m) => m.user_id));
    return (membersData?.data?.members ?? []).filter(
      (m) => m.user_id === createdBy || managerIds.has(m.user_id) || isOwnerRole(m.role),
    );
  }, [createdBy, managersData, membersData]);
}
