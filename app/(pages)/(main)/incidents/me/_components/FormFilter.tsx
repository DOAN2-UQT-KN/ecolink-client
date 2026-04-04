"use client";

import { memo, useContext, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { IncidentMeContext } from "../_context/IncidentMeContext";
import { STATUS } from "@/constants/status";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import useGetParam from "@/hooks/useGetParam";

const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const context = useContext(IncidentMeContext);

  if (!context) return null;

  const { filters, setFilters } = context;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = useGetParam<string>("search", "string", "");
  const [searchValue, setSearchValue] = useState(urlSearch);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Sync context with debounced search and update URL
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters({ search: debouncedSearchValue });

      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearchValue) {
        params.set("search", debouncedSearchValue);
      } else {
        params.delete("search");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearchValue, pathname, router, searchParams, setFilters, filters.search]);

  // Update local search value if filters.search changes externally (e.g. back button)
  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  const handleStatusChange = (value: string) => {
    const status = value === "all" ? undefined : Number(value);
    setFilters({ status });

    const params = new URLSearchParams(searchParams.toString());
    if (status !== undefined) {
      params.set("status", status.toString());
    } else {
      params.delete("status");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const renderStatusFilter = () => {
    return (
      <Tabs
        value={filters.status?.toString() || "all"}
        onValueChange={handleStatusChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="bg-[#887A47]/10 border-none h-12 rounded-[5px] w-full sm:w-auto overflow-x-auto overflow-y-hidden no-scrollbar gap-3">
          <TabsTrigger
            value="all"
            className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t("All")}
          </TabsTrigger>
          <TabsTrigger
            value={STATUS.DRAFT.toString()}
            className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t("DRAFT")}
          </TabsTrigger>
          <TabsTrigger
            value={STATUS.PENDING.toString()}
            className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t("Pending")}
          </TabsTrigger>
          <TabsTrigger
            value={STATUS.COMPLETED.toString()}
            className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t("Completed")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
  };

  const renderSearchFilter = () => {
    return (
      <div className="relative w-full sm:w-72 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          className="pl-10 h-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 text-base !font-display-1"
          placeholder={t("Search by Title or Description...")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-4 ">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        {renderStatusFilter()}
        {renderSearchFilter()}
      </div>
    </div>
  );
});

export default FormFilter;
