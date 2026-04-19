"use client";

import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CampaignList } from "./CampaignList";
import { OrganizationMembers } from "./OrganizationMembers";

export const ORGANIZATION_DETAIL_TAB_ITEMS = [
  { value: "campaign", labelKey: "Campaign" },
  { value: "members", labelKey: "Members" },
] as const;

export type OrganizationDetailTabValue =
  (typeof ORGANIZATION_DETAIL_TAB_ITEMS)[number]["value"];

export const OrganizationDetailTabs = memo(function OrganizationDetailTabs() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<OrganizationDetailTabValue>("campaign");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as OrganizationDetailTabValue)}
    >
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
        {ORGANIZATION_DETAIL_TAB_ITEMS.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t(item.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="campaign" className="mt-0">
        <CampaignList />
      </TabsContent>
      <TabsContent value="members" className="mt-0">
        <OrganizationMembers enabled={tab === "members"} />
      </TabsContent>
    </Tabs>
  );
});
