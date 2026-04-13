"use client";

import { cn } from "@/libs/utils";
import { AdminLayoutProvider, useAdminLayout } from "../_context/AdminLayoutContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminHeader } from "./AdminHeader";

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile, theme } = useAdminLayout();

  const mainMarginLeft = isMobile ? 0 : collapsed ? 64 : 256;

  return (
    <div
      className={cn(
        "flex min-h-dvh w-full max-w-[100vw] bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <AdminSidebar />
      <AdminMobileDrawer />

      <div
        className="flex min-h-dvh min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminLayoutProvider>
  );
}
