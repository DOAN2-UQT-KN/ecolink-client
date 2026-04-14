"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Logo from "@/components/client/layout/Logo";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";

export function AdminHeader() {
  const { isMobile, setMobileNavOpen, theme, toggleTheme } = useAdminLayout();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isMobile && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("Open navigation")}
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Logo size="small" href="/admin" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("Light mode") : t("Dark mode")}
      >
        {theme === "dark" ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )}
      </Button>
    </header>
  );
}
