"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Breadcrumbs, type BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { cn } from "@/libs/utils";

import { GiftProvider } from "./_context/GiftContext";
import { FormFilter } from "./_components/FormFilter";
import { GiftList } from "./_components/GiftList";

const GiftsPageContent = memo(function GiftsPageContent() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("Gifts"), path: "/gifts", type: "page" },
    ],
    [t],
  );

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      <div
        className={cn(
          "sticky top-0 z-[45] -mx-4 mb-8 bg-background-primary px-4 pb-4 lg:-mx-20 lg:px-20",
          isScrolled ? "pt-[100px]" : "pt-0",
        )}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="mt-4">
          <FormFilter />
        </div>
      </div>

      <GiftList />
    </div>
  );
});

export default function GiftsPage() {
  return (
    <GiftProvider>
      <GiftsPageContent />
    </GiftProvider>
  );
}
