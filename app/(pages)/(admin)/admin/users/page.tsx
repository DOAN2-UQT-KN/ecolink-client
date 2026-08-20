import { useMemo } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";

import { UserProvider } from "./_context/UserContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";

function UsersContent() {
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Users", path: "/admin/users", type: "page" },
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

export default function AdminUsersPage() {
  return (
    <UserProvider>
      <UsersContent />
    </UserProvider>
  );
}
