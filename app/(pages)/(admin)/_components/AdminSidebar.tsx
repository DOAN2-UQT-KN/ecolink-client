"use client";

import { useTranslation } from "react-i18next";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { useAdminLayout } from "../_context/AdminLayoutContext";
import { AdminNavLinks } from "./AdminNavLinks";

export function AdminSidebar() {
  const { collapsed, toggleCollapsed, isMobile } = useAdminLayout();
  const { t } = useTranslation();

  if (isMobile) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-2">
        {!collapsed && (
          <span className="truncate px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Admin dashboard")}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AdminNavLinks collapsed={collapsed} />
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </Button>
      </div>
    </aside>
  );
}
