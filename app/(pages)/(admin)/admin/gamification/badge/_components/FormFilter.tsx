"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbZoom } from "react-icons/tb";

import { useBadgeAdminContext } from "../_context/BadgeAdminContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

export function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange, onResetFilters } = useBadgeAdminContext();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== filters.search) {
      onFilterChange({ search: next });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const fields = useMemo(
    () => [
      {
        key: "search",
        label: t("Search"),
        render: () => (
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border border-zinc-300 pl-10"
              placeholder={t("Badge slug or name...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: "includeInactive",
        label: t("Include deleted definitions"),
        render: () => (
          <label className="flex cursor-pointer items-center gap-2 pt-2">
            <Checkbox
              checked={filters.includeInactive}
              onCheckedChange={(checked) =>
                onFilterChange({ includeInactive: checked === true })
              }
            />
            <span className="text-sm text-foreground">{t("Show soft-deleted rows")}</span>
          </label>
        ),
      },
    ],
    [filters.includeInactive, onFilterChange, searchInput, t],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {t("Gamification badge admin placeholder")}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
          {t("Reset")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <Field key={field.key}>
            <FieldLabel className="text-sm font-medium text-foreground-secondary">
              {field.label}
            </FieldLabel>
            {field.render()}
          </Field>
        ))}
      </div>
    </div>
  );
}
