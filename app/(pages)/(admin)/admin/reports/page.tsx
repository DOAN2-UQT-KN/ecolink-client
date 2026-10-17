import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { IncidentProvider } from "./_context/IncidentContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function ReportsContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Reports", path: "/admin/reports", type: "page" },
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

export default function AdminReportsPage() {
  return (
    <IncidentProvider>
      <ReportsContent />
    </IncidentProvider>
  );
}
