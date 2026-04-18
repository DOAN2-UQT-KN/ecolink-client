import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TriangleAlert,
  Building2,
  Settings,
} from "lucide-react";
import { TbUsersGroup, TbMessageReport, TbLayoutDashboard, TbSettings } from "react-icons/tb";
import { IconType } from "react-icons";

export type AdminNavItem = {
  href: string;
  /** i18n key in common.json */
  labelKey: string;
  icon: IconType;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", labelKey: "Admin dashboard", icon: TbLayoutDashboard },
  { href: "/admin/incidents", labelKey: "Incidents", icon: TbMessageReport },
  { href: "/admin/organizations", labelKey: "Organizations", icon: TbUsersGroup },
  { href: "/admin/settings", labelKey: "Settings", icon: TbSettings },
];
