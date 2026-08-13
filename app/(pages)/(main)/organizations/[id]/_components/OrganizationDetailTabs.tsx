"use client";

import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetJoinRequestsByOrg } from "@/apis/organization/organizationById";
import type { IGetJoinRequestsRequest } from "@/apis/organization/models/joinRequestModels";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS } from "@/constants/status";

import { CampaignList } from "./CampaignList";
import { OrganizationJoinRequests } from "./OrganizationJoinRequests";
import { OrganizationMembers } from "./OrganizationMembers";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

function formatApprovalRequestBadgeCount(total: number): string {
  if (total >= 9) return "9+";
  return String(total);
}

const ALL_ORGANIZATION_DETAIL_TAB_ITEMS = [
  { value: "campaign", labelKey: "Campaign" },
  { value: "members", labelKey: "Members" },
  { value: "join-requests", labelKey: "Join requests" },
] as const;

export type OrganizationDetailTabValue =
  (typeof ALL_ORGANIZATION_DETAIL_TAB_ITEMS)[number]["value"];

/** Tabs shown to visitors (group owner also sees these plus join-requests). */
export const ORGANIZATION_DETAIL_TAB_ITEMS = ALL_ORGANIZATION_DETAIL_TAB_ITEMS.filter(
  (item) => item.value !== "join-requests",
);

export const OrganizationDetailTabs = memo(function OrganizationDetailTabs() {
  const { t } = useTranslation();
  const { showYourGroupTag, organizationId } = useOrganizationDetail();
  const [tab, setTab] = useState<OrganizationDetailTabValue>("campaign");

  const joinRequestsCountQuery = useMemo((): IGetJoinRequestsRequest => {
    return {
      organization_id: organizationId,
      page: 1,
      limit: 50,
      status: STATUS.PENDING,
      sort_by: "created_at",
      sort_order: "desc",
    };
  }, [organizationId]);

  const { data: joinRequestsData } = useGetJoinRequestsByOrg(
    joinRequestsCountQuery,
    {
      enabled: showYourGroupTag && Boolean(organizationId),
    },
  );

  const pendingApprovalCount = joinRequestsData?.data?.total ?? 0;

  const tabItems = useMemo(() => {
    return showYourGroupTag
      ? [...ALL_ORGANIZATION_DETAIL_TAB_ITEMS]
      : [...ORGANIZATION_DETAIL_TAB_ITEMS];
  }, [showYourGroupTag]);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as OrganizationDetailTabValue)}
    >
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
        {tabItems.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {t(item.labelKey)}
              {item.value === "join-requests" && pendingApprovalCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="min-w-5 px-1.5 tabular-nums border-red-500 bg-red-100 text-red-500"
                >
                  {formatApprovalRequestBadgeCount(pendingApprovalCount)}
                </Badge>
              ) : null}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="campaign" className="mt-0">
        <CampaignList enabled={tab === "campaign"} />
      </TabsContent>
      <TabsContent value="members" className="mt-0">
        <OrganizationMembers enabled={tab === "members"} />
      </TabsContent>
      <TabsContent value="join-requests" className="mt-0">
        <OrganizationJoinRequests enabled={tab === "join-requests"} />
      </TabsContent>
    </Tabs>
  );
});
