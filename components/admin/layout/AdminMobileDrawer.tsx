"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { AdminNavLinks } from "./AdminNavLinks";

export function AdminMobileDrawer() {
  const { mobileNavOpen, setMobileNavOpen, isMobile } = useAdminLayout();
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, isMobile]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  if (!isMobile) return null;

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
          mobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden
      />
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[min(18rem,100vw)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-200 ease-out",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
          <span className="truncate text-sm font-semibold">
            {t("Admin dashboard")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("Close menu")}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNavLinks onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>
    </>
  );
}
