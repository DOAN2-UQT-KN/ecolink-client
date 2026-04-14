"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/libs/utils";
import { adminNavItems } from "@/app/(pages)/(admin)/_config/adminNav";

function navItemActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavLinks({
  collapsed,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className={cn("flex flex-col gap-1 p-2", className)}>
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = navItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? t(item.labelKey) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
            <span
              className={cn(
                "truncate transition-[opacity,width] duration-200",
                collapsed && "sr-only w-0 overflow-hidden opacity-0",
              )}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
