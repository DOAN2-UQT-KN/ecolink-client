import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { CampaignProvider } from "./_context/CampaignContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

const BREADCRUMBS: BreadcrumbItemProps[] = [
  { label: "Dashboard", path: "/admin", type: "link" },
  { label: "Campaigns", path: "/admin/campaigns", type: "page" },
];

function CampaignsContent() {
  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={BREADCRUMBS} isAdmin={true} />
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
