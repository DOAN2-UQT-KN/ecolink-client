'use client';

import React, { createContext, ReactNode, useCallback, useMemo } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useGetCampaignById } from '@/apis/campaign/campaignById';
import {
  useCancelJoinCampaign,
  useGetMyJoinRequests,
  useJoinCampaign,
} from '@/apis/campaign/joinCampaign';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import { STATUS } from '@/constants/status';

import useAuthStore from '@/stores/useAuthStore';

import { parseCampaignDetailData } from '../_services/campaignDetailService';

export interface CampaignDetailContextType {
  campaignId: string;
  campaign: ICampaign | undefined;
  isCampaignOwner: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  /** Derived presentation fields */
  currentMembers: number;
  maxMembers: number;
  daysSinceStart: number | null;
  memberProgress: number;
  archivedTasksCount: number;
  isJoining: boolean;
  isCancelling: boolean;
  handleJoinCampaign: () => void;
  handleCancelJoinRequest: () => void;
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
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data, isLoading, isError, isFetching } = useGetCampaignById(campaignId, {
    enabled: Boolean(campaignId),
  });

  const { mutate: joinCampaignMutate, isPending: isJoining } = useJoinCampaign({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });

  const { mutate: cancelJoinMutate, isPending: isCancelling } = useCancelJoinCampaign({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });

  const campaign = data?.data?.campaign;

  const isCampaignOwner = useMemo(
    () =>
      currentUserId != null && campaign?.owner?.id != null && campaign.owner.id === currentUserId,
    [currentUserId, campaign?.owner?.id],
  );

  const needsJoinRequestIdFromList =
    campaign?.request_status === STATUS.PENDING && !campaign?.join_request_id;

  const { data: myJoinRequestsData } = useGetMyJoinRequests(
    {
      campaign_id: campaignId,
      status: STATUS.PENDING,
      page: 1,
      limit: 1,
    },
    {
      enabled: Boolean(campaignId) && needsJoinRequestIdFromList,
    },
  );

  const joinRequestIdForCancel =
    campaign?.join_request_id ?? myJoinRequestsData?.data?.join_requests?.[0]?.id;

  const derived = useMemo(() => {
    if (!campaign) {
      return {
        currentMembers: 0,
        maxMembers: 0,
        daysSinceStart: null as number | null,
        memberProgress: 0,
        archivedTasksCount: 0,
      };
    }
    const p = parseCampaignDetailData(campaign);
    return {
      currentMembers: p.currentMembers,
      maxMembers: p.maxMembers,
      daysSinceStart: p.daysSinceStart,
      memberProgress: p.memberProgress,
      archivedTasksCount: p.archivedTasksDisplay,
    };
  }, [campaign]);

  const handleJoinCampaign = useCallback(() => {
    if (!campaignId || isJoining) {
      return;
    }
    joinCampaignMutate({ campaign_id: campaignId });
  }, [campaignId, isJoining, joinCampaignMutate]);

  const handleCancelJoinRequest = useCallback(() => {
    if (!joinRequestIdForCancel || isCancelling) {
      return;
    }
    cancelJoinMutate({ requestId: joinRequestIdForCancel });
  }, [joinRequestIdForCancel, isCancelling, cancelJoinMutate]);

  const contextValue = useMemo(
    () => ({
      campaignId,
      campaign,
      isCampaignOwner,
      isLoading,
      isError,
      isFetching,
      currentMembers: derived.currentMembers,
      maxMembers: derived.maxMembers,
      daysSinceStart: derived.daysSinceStart,
      memberProgress: derived.memberProgress,
      archivedTasksCount: derived.archivedTasksCount,
      isJoining,
      isCancelling,
      handleJoinCampaign,
      handleCancelJoinRequest,
    }),
    [
      campaignId,
      campaign,
      isCampaignOwner,
      isLoading,
      isError,
      isFetching,
      derived,
      isJoining,
      isCancelling,
      handleJoinCampaign,
      handleCancelJoinRequest,
    ],
  );

  return (
    <CampaignDetailContext.Provider value={contextValue}>{children}</CampaignDetailContext.Provider>
  );
}
