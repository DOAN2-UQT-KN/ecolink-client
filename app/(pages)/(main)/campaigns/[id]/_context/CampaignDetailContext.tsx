import React, { createContext, ReactNode, useMemo } from 'react';

import { useGetCampaignById } from '@/apis/campaign/getCampaignById';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import { CAMPAIGN_REGISTRABLE_STATUSES } from '@/constants/campaignLifecycle';
import { ADMIN_ROLE_ID } from '@/constants/roles';
import useAuthStore from '@/stores/useAuthStore';

interface CampaignDetailContextType {
  campaignId: string;
  campaign: ICampaign | undefined;

  canManageCampaign: boolean;
  isLoading: boolean;
  isError: boolean;
  isRegistered: boolean;
  hasOpenShift: boolean;
  isPlatformAdmin: boolean;

  canViewVolunteers: boolean;
}

export const CampaignDetailContext = createContext<CampaignDetailContextType | undefined>(
  undefined,
);

export function CampaignDetailProvider({
  campaignId,
  children,
}: {
  campaignId: string;
  children: ReactNode;
}) {
  const { data, isLoading, isError } = useGetCampaignById(campaignId, {
    enabled: Boolean(campaignId),
  });

  const campaign = data?.data?.campaign;

  const canManageCampaign = Boolean(campaign?.can_manage_campaign);
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);

  const derived = useMemo(() => {
    if (!campaign) {
      return {
        isRegistered: false,
        hasOpenShift: false,
      };
    }
    const now = Date.now();
    return {
      isRegistered: (campaign.my_shift_ids?.length ?? 0) > 0,
      hasOpenShift:
        CAMPAIGN_REGISTRABLE_STATUSES.includes(campaign.status ?? -1) &&
        (campaign.shifts ?? []).some(
          (s) => s.min_volunteers > 0 && new Date(s.start_at).getTime() > now,
        ),
    };
  }, [campaign]);

  const contextValue = useMemo(
    () => ({
      campaignId,
      campaign,
      canManageCampaign,
      isLoading,
      isError,
      isPlatformAdmin,
      canViewVolunteers: canManageCampaign || derived.isRegistered || isPlatformAdmin,
      ...derived,
    }),
    [campaignId, campaign, canManageCampaign, isLoading, isError, isPlatformAdmin, derived],
  );

  return (
    <CampaignDetailContext.Provider value={contextValue}>{children}</CampaignDetailContext.Provider>
  );
}
