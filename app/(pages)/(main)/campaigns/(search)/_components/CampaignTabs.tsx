"use client";

import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCampaignSearch } from "../_context/CampaignSearchContext";

export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useCampaignSearch();

  const handleTabChange = useCallback(
    (value: string) => {
      setViewMode(value === "mine" ? "mine" : "explore");
    },
    [setViewMode],
  );

  return (
    <Tabs value={viewMode} onValueChange={handleTabChange}>
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10">
        <TabsTrigger
          value="mine"
          className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
        >
          {t("Mine")}
        </TabsTrigger>
        <TabsTrigger
          value="explore"
          className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
        >
          {t("Explore")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
});
