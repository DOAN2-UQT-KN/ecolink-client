"use client";

import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CampaignTask } from "./CampaignTask";
import { CurrentMember } from "./CurrentMember";
import { DetailInformation } from "./DetailInformation";

const CAMPAIGN_TAB_ITEMS = [
  { value: "detail", labelKey: "Detail Information" },
  { value: "members", labelKey: "Member List" },
  { value: "tasks", labelKey: "Tasks" },
] as const;

export type CampaignTabValue = (typeof CAMPAIGN_TAB_ITEMS)[number]["value"];

export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CampaignTabValue>("detail");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as CampaignTabValue)}
    >
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
        {CAMPAIGN_TAB_ITEMS.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t(item.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="detail" className="mt-0">
        <DetailInformation />
      </TabsContent>
      <TabsContent value="members" className="mt-0">
        <CurrentMember />
      </TabsContent>
      <TabsContent value="tasks" className="mt-0">
        <CampaignTask />
      </TabsContent>
    </Tabs>
  );
});
