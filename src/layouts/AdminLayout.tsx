import { Outlet } from "react-router-dom";

import { AdminShell } from "@/components/admin/layout/AdminShell";

export default function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
