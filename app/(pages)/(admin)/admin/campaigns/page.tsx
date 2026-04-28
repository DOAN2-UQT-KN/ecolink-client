"use client";

import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { CampaignProvider } from "./_context/CampaignContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function CampaignsContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Campaigns", path: "/admin/campaigns", type: "page" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      <FormFilter />
      <DataTable />
    </div>
  );
}

export default function AdminCampaignsPage() {
  return (
    <CampaignProvider>
      <CampaignsContent />
    </CampaignProvider>
  );
}
