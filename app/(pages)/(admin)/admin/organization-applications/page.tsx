import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { ApplicationsProvider } from "./_context/ApplicationsContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function ApplicationsContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      {
        label: "Organization applications",
        path: "/admin/organization-applications",
        type: "page",
      },
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

export default function AdminOrganizationApplicationsPage() {
  return (
    <ApplicationsProvider>
      <ApplicationsContent />
    </ApplicationsProvider>
  );
}
