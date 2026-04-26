"use client";

import { useContext } from "react";

import { CampaignDetailContext } from "../_context/CampaignDetailContext";

export const useCampaignDetail = () => {
  const context = useContext(CampaignDetailContext);
  if (!context) {
    throw new Error(
      "useCampaignDetail must be used within a CampaignDetailProvider",
    );
  }
  return context;
};

/** @alias useCampaignDetail */
export const useContextProvider = useCampaignDetail;
