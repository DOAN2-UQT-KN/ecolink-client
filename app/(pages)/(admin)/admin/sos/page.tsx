import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { SosProvider } from "./_context/SosContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function SosContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "SOS", path: "/admin/sos", type: "page" },
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

export default function AdminSosPage() {
  return (
    <SosProvider>
      <SosContent />
    </SosProvider>
  );
}
