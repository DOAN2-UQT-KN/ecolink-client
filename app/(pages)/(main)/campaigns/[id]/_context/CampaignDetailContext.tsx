import React, { createContext, ReactNode, useMemo } from 'react';

import { useGetCampaignById } from '@/apis/campaign/campaignById';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import { CAMPAIGN_REGISTRABLE_STATUSES } from '@/constants/campaignLifecycle';

export interface CampaignDetailContextType {
  campaignId: string;
  campaign: ICampaign | undefined;
  /**
   * From API `can_manage_campaign`: creator, assigned manager, or LR/OWNER of the campaign's
   * organization (creator/manager only while still an active member).
   */
  canManageCampaign: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  /** The viewer holds at least one shift. */
  isRegistered: boolean;
  /** Some shift is on and not started, in an upcoming or running campaign. */
  hasOpenShift: boolean;
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
  const { data, isLoading, isError, isFetching } = useGetCampaignById(campaignId, {
    enabled: Boolean(campaignId),
  });

  const campaign = data?.data?.campaign;

  const canManageCampaign = Boolean(campaign?.can_manage_campaign);

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
      isFetching,
      ...derived,
    }),
    [campaignId, campaign, canManageCampaign, isLoading, isError, isFetching, derived],
  );

  return (
    <CampaignDetailContext.Provider value={contextValue}>{children}</CampaignDetailContext.Provider>
  );
}
