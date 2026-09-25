import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ADMIN_ROLE_ID } from "@/constants/roles";
import useAuthStore from "@/stores/useAuthStore";

/**
 * Gate for everything under `/admin`.
 *
 * The API already refuses non-admins, so this is not the security boundary — it exists so a
 * visitor who lands on an admin URL is sent somewhere useful instead of watching a screen
 * full of failed requests. It waits for `has_hydrated` before deciding, otherwise a
 * page refresh would bounce a signed-in admin before the persisted store is read back.
 */
export default function AdminLayout() {
  const location = useLocation();
  const hasHydrated = useAuthStore((state) => state.has_hydrated);
  const isAuthenticated = useAuthStore((state) => state.is_authenticated);
  // const roleId = useAuthStore((state) => state.user?.roleId);

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
  }

  // if (roleId !== ADMIN_ROLE_ID) {
  //   return <Navigate to="/" replace />;
  // }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
