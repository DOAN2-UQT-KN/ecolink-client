"use client";

import React, { memo, useMemo } from "react";
import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useGetCampaigns } from "@/apis/campaign/getCampaigns";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";
import SummaryCampaignCard from "@/components/client/shared/SummaryCampaignCard";

export const CampaignList = memo(function CampaignList({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const { organizationId, organization } = useOrganizationDetail();

  const request = useMemo(
    () => ({
      organization_id: organizationId,
      page: 1,
      limit: 50,
    }),
    [organizationId],
  );

  const { data, isLoading, isError } = useGetCampaigns(request, {
    enabled: enabled && Boolean(organizationId),
  });

  const campaigns = data?.data?.campaigns ?? [];

  if (!organization) {
    return null;
  }

  return (
    <div className="w-full min-h-[220px] rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm">
      {/* <div className="text-sm font-medium text-foreground">{t("Campaign")}</div> */}
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="mt-2 text-sm text-destructive">
          {t("Could not load campaigns.")}
        </p>
      ) : campaigns.length === 0 ? (
        <div className="mt-2 flex justify-center py-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t("No campaigns found.")}</EmptyTitle>
              <EmptyDescription>
                {t("There are no campaigns for this group yet.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <ul className="mt-4 ">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="py-3 first:pt-0 last:pb-0 text-sm font-medium text-foreground"
            >
              <SummaryCampaignCard campaign={c} />
              {/* {c.title} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
