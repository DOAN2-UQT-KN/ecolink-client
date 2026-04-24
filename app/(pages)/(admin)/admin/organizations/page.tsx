"use client";

import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { OrganizationProvider } from "./_context/OrganizationContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function OrganizationsContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Organizations", path: "/admin/organizations", type: "page" },
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

export default function AdminOrganizationsPage() {
  return (
    <OrganizationProvider>
      <OrganizationsContent />
    </OrganizationProvider>
  );
}
