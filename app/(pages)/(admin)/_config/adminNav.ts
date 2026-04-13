import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TriangleAlert,
  Building2,
  Settings,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  /** i18n key in common.json */
  labelKey: string;
  icon: LucideIcon;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", labelKey: "Admin dashboard", icon: LayoutDashboard },
  { href: "/incidents", labelKey: "Incidents", icon: TriangleAlert },
  { href: "/organizations", labelKey: "Organizations", icon: Building2 },
  { href: "/admin/settings", labelKey: "Settings", icon: Settings },
];
