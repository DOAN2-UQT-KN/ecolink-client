"use client";

import React, { createContext, ReactNode, useCallback, useMemo } from "react";

import { useGetCampaignById } from "@/apis/campaign/campaignById";
import type { ICampaign } from "@/apis/campaign/models/campaign";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { useTranslation } from "react-i18next";

import { parseCampaignDetailData } from "../_services/campaignDetailService";

export interface CampaignDetailContextType {
  campaignId: string;
  campaign: ICampaign | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  /** Derived presentation fields */
  currentMembers: number;
  maxMembers: number;
  daysSinceStart: number | null;
  memberProgress: number;
  archivedTasksCount: number;
  handleJoinCampaign: () => void;
}

export const CampaignDetailContext = createContext<
  CampaignDetailContextType | undefined
>(undefined);

export function CampaignDetailProvider({
  campaignId,
  children,
}: {
  campaignId: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching } = useGetCampaignById(
    campaignId,
    { enabled: Boolean(campaignId) },
  );

  const campaign = data?.data?.campaign;

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
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Info,
      title: t("Join campaign"),
      content: t("Campaign registration is not available yet. Please check back later."),
    });
  }, [t]);

  const contextValue = useMemo(
    () => ({
      campaignId,
      campaign,
      isLoading,
      isError,
      isFetching,
      currentMembers: derived.currentMembers,
      maxMembers: derived.maxMembers,
      daysSinceStart: derived.daysSinceStart,
      memberProgress: derived.memberProgress,
      archivedTasksCount: derived.archivedTasksCount,
      handleJoinCampaign,
    }),
    [
      campaignId,
      campaign,
      isLoading,
      isError,
      isFetching,
      derived,
      handleJoinCampaign,
    ],
  );

  return (
    <CampaignDetailContext.Provider value={contextValue}>
      {children}
    </CampaignDetailContext.Provider>
  );
}
