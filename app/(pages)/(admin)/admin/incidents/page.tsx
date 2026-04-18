"use client";

import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { IncidentProvider } from "./_context/IncidentContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function IncidentsContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Incidents", path: "/admin/incidents", type: "page" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <FormFilter />
      <DataTable />
    </div>
  );
}

export default function AdminIncidentsPage() {
  return (
    <IncidentProvider>
      <IncidentsContent />
    </IncidentProvider>
  );
}
