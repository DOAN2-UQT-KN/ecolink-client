"use client";

import React, { useMemo, useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { cn } from "@/libs/utils";

import { OrganizationSearchProvider } from "./_context/OrganizationSearchContext";
import { OrganizationSearchFilters } from "./_components/OrganizationSearchFilters";
import { OrganizationList } from "./_components/OrganizationList";

const OrganizationsExplorePage = memo(function OrganizationsExplorePage() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      {
        label: t("Organizations"),
        path: "/organizations",
        type: "page",
      },
    ],
    [t],
  );

  return (
    <OrganizationSearchProvider>
      <div className="max-w-7xl mx-auto w-full relative">
        <div
          className={cn(
            "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20 mb-8",
            isScrolled ? "pt-[100px]" : "pt-0",
          )}
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <div className="mt-4">
            <OrganizationSearchFilters />
          </div>
        </div>

        <OrganizationList />
      </div>
    </OrganizationSearchProvider>
  );
});

export default OrganizationsExplorePage;
