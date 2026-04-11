"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";

import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useIncidentSearch } from "../_context/IncidentSearchContext";
import { useDebounce } from "@/hooks/useDebounce";
import { STATUS } from "@/constants/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MultiSelect,
} from "@/components/ui/select";
import { Button } from "@/components/shared/Button";
import { Field, FieldLabel } from "@/components/ui/field";
import { TbZoomReset, TbZoom } from "react-icons/tb";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const wasteTypeOptions = [
  { label: "Household waste", value: "household" },
  { label: "Construction waste", value: "construction" },
  { label: "Industrial waste", value: "industrial" },
  { label: "Hazardous waste", value: "hazardous" },
];

const severityOptions = [
  { label: "Small", value: "1" },
  { label: "Medium", value: "2" },
  { label: "Large", value: "3" },
];

const statusOptions = [
  { label: "Pending", value: STATUS.PENDING.toString() },
  { label: "Approved", value: STATUS.APPROVED.toString() },
  { label: "Verified", value: STATUS.VERIFIED.toString() },
  { label: "Completed", value: STATUS.COMPLETED.toString() },
];

export const SearchSidebar = memo(function SearchSidebar() {
  const { t } = useTranslation();
  const {

    filters,
    setFilters,
    resetFilters: resetContextFilters,
  } = useIncidentSearch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [prevSearch, setPrevSearch] = useState(filters.search);

  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchValue(filters.search || "");
  }

  const debouncedSearchValue = useDebounce(searchValue, 500);

  const updateURL = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters({ search: debouncedSearchValue });
      updateURL("search", debouncedSearchValue);
    }
  }, [debouncedSearchValue, filters.search, setFilters, updateURL]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === "all" ? undefined : Number(value);
      setFilters({ status });
      updateURL("status", status?.toString());
    },
    [setFilters, updateURL],
  );

  const handleWasteTypeChange = useCallback(
    (values: string[]) => {
      const wasteType = values.join(",");
      setFilters({ waste_type: wasteType });
      updateURL("waste_type", wasteType);
    },
    [setFilters, updateURL],
  );

  const handleSeverityChange = useCallback(
    (value: string) => {
      const severity = value === "all" ? undefined : Number(value);
      setFilters({ severity_level: severity });
      updateURL("severity_level", severity?.toString());
    },
    [setFilters, updateURL],
  );

  const resetFilters = useCallback(() => {
    resetContextFilters();
    router.replace(pathname, { scroll: false });
  }, [pathname, resetContextFilters, router]);

  const selectedWasteTypes = useMemo(() => {
    return filters.waste_type ? filters.waste_type.split(",") : [];
  }, [filters.waste_type]);

  const renderFormFields = useCallback(() => {
    return (
      <div className="space-y-6">
        {/* Text Search */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Keywords")}
          </FieldLabel>
          <div className="relative group">
            <TbZoom className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              className="pl-10 h-11 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 focus-visible:bg-white transition-all"
              placeholder={t("Title, description...")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </Field>

        {/* Status Filter */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Status")}
          </FieldLabel>
          <Select
            value={filters.status?.toString() || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50">
              <SelectValue placeholder={t("Select status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Statuses")}</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Waste Type Filter */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Waste Type")}
          </FieldLabel>
          <MultiSelect
            options={wasteTypeOptions.map((o) => ({ ...o, label: t(o.label) }))}
            value={selectedWasteTypes}
            onChange={handleWasteTypeChange}
            placeholder={t("All types")}
            triggerClassName=" border-1 border-[rgba(136,122,71,0.5)] focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 w-full"
          />
        </Field>

        {/* Severity Filter */}
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Severity")}
          </FieldLabel>
          <Select
            value={filters.severity_level?.toString() || "all"}
            onValueChange={handleSeverityChange}
          >
            <SelectTrigger className="w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50">
              <SelectValue placeholder={t("Select severity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Severities")}</SelectItem>
              {severityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Reset Button */}
        <Button
          variant="outlined-brown"
          className="w-full h-11   border-dashed border-2 hover:border-primary hover:text-primary transition-all gap-2"
          onClick={resetFilters}
        >
          <div className="flex flex-row items-center justify-center gap-2">
            <TbZoomReset size={16} />
            {t("Reset Filters")}
          </div>
        </Button>
      </div>
    );
  }, [
    t,
    searchValue,
    filters.status,
    filters.severity_level,
    handleStatusChange,
    selectedWasteTypes,
    handleWasteTypeChange,
    handleSeverityChange,
    resetFilters,
  ]);

  return (
    <aside className="w-full lg:w-[320px] lg:sticky lg:top-[140px] z-[40] space-y-2 p-6 border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 h-fit">
      <div>
        <h3 className="font-display-3 text-button-accent ">
          {t("Search Incidents")}
        </h3>
      </div>

      {renderFormFields()}
    </aside>
  );
});

