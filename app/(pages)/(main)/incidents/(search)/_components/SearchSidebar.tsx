"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
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

export const SearchSidebar = () => {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useIncidentSearch();

  const [searchValue, setSearchValue] = useState(filters.search || "");
  const debouncedSearchValue = useDebounce(searchValue, 500);

  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters({ search: debouncedSearchValue });
    }
  }, [debouncedSearchValue, filters.search, setFilters]);

  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  const handleStatusChange = (value: string) => {
    setFilters({ status: value === "all" ? undefined : Number(value) });
  };

  const handleWasteTypeChange = (values: string[]) => {
    setFilters({ waste_type: values.join(",") });
  };

  const handleSeverityChange = (value: string) => {
    setFilters({ severity_level: value === "all" ? undefined : Number(value) });
  };

  const selectedWasteTypes = useMemo(() => {
    return filters.waste_type ? filters.waste_type.split(",") : [];
  }, [filters.waste_type]);

  return (
    <aside className="w-full lg:w-[320px] lg:sticky lg:top-[170px] z-[40] space-y-8 bg-card p-6 rounded-2xl border border-border/50 shadow-sm h-fit">
      <div className="space-y-2">
        <h3 className="font-display-2 font-semibold text-foreground tracking-tight">
          {t("Search Incidents")}
        </h3>
        <p className="text-sm text-foreground-secondary">
          {t("Find reports near you or by category")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Text Search */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary ml-1">
            {t("Keywords")}
          </label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              className="pl-10 h-11 border-border/60 bg-white/50 focus-visible:bg-white transition-all rounded-xl"
              placeholder={t("Title, description...")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary ml-1">
            {t("Status")}
          </label>
          <Select
            value={filters.status?.toString() || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full h-11 rounded-xl border-border/60 bg-white/50">
              <SelectValue placeholder={t("Select status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Statuses")}</SelectItem>
              <SelectItem value={STATUS.PENDING.toString()}>
                {t("Pending")}
              </SelectItem>
              <SelectItem value={STATUS.APPROVED.toString()}>
                {t("Approved")}
              </SelectItem>
              <SelectItem value={STATUS.VERIFIED.toString()}>
                {t("Verified")}
              </SelectItem>
              <SelectItem value={STATUS.COMPLETED.toString()}>
                {t("Completed")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Waste Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary ml-1">
            {t("Waste Type")}
          </label>
          <MultiSelect
            options={wasteTypeOptions.map((o) => ({ ...o, label: t(o.label) }))}
            value={selectedWasteTypes}
            onChange={handleWasteTypeChange}
            placeholder={t("All types")}
            triggerClassName="h-11 rounded-xl border-border/60 bg-white/50"
          />
        </div>

        {/* Severity Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary ml-1">
            {t("Severity")}
          </label>
          <Select
            value={filters.severity_level?.toString() || "all"}
            onValueChange={handleSeverityChange}
          >
            <SelectTrigger className="w-full h-11 rounded-xl border-border/60 bg-white/50">
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
        </div>

        {/* Reset Button */}
        <Button
          variant="outlined-brown"
          className="w-full h-11 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all gap-2"
          onClick={resetFilters}
        >
          <X size={16} />
          {t("Reset Filters")}
        </Button>
      </div>
    </aside>
  );
};
