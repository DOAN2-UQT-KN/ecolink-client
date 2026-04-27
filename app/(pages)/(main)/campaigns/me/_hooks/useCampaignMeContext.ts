"use client";

import { useContext } from "react";
import { CampaignMeContext } from "../_context/CampaignMeContext";

export default function useCampaignMeContext() {
  const context = useContext(CampaignMeContext);
  if (!context) {
    throw new Error("useCampaignMeContext must be used within CampaignMeProvider");
  }
  return context;
}
