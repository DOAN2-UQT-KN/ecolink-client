"use client";

import { useContext } from "react";

import { CampaignContext } from "../_context/CampaignContext";

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
};
