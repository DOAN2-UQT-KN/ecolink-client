"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { IncidentSearchProvider } from "./_context/IncidentSearchContext";
import { SearchSidebar } from "./_components/SearchSidebar";
import { IncidentList } from "./_components/IncidentList";
import { cn } from "@/libs/utils";

const IncidentSearchPage = () => {
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
      { label: t("Search Incidents"), path: "/incidents/search", type: "page" },
    ],
    [t],
  );

  return (
    <IncidentSearchProvider>
      <div className="max-w-7xl mx-auto w-full relative">
        {/* Breadcrumbs Section - Sticky with dynamic padding to cover transparent header gap only when scrolling */}
        <div
          className={cn(
            "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20 mb-8",
            isScrolled ? "pt-[100px]" : "pt-0",
          )}
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Fixed/Sticky Sidebar on the left - sticks below breadcrumbs */}
          <SearchSidebar />

          {/* Search Results List on the right */}
          <IncidentList />
        </div>
      </div>
    </IncidentSearchProvider>
  );
};

export default IncidentSearchPage;
