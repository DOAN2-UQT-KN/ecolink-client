"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { HiOutlineSortAscending, HiOutlineSortDescending } from "react-icons/hi";
import { TbZoom, TbZoomReset } from "react-icons/tb";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/shared/Button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/libs/utils";
import type { IGetOrganizationsRequest } from "@/apis/organization/models/getOrganizations";
import { useOrganizationSearch } from "../_context/OrganizationSearchContext";

type SortOptionProps = {
  active: boolean;
  icon: typeof HiOutlineSortAscending | typeof HiOutlineSortDescending;
  ariaLabel: string;
  onClick: () => void;
};

const SortOptionButton = memo(function SortOptionButton({
  active,
  icon: Icon,
  ariaLabel,
  onClick,
}: SortOptionProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-1 py-1 -mx-1 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? "text-primary" : "text-foreground-secondary hover:text-foreground",
      )}
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
});

const SortFieldRow = memo(function SortFieldRow({
  sortBy,
  fieldLabel,
  filters,
  handleSort,
  t,
}: {
  sortBy: "created_at" | "updated_at";
  fieldLabel: string;
  filters: Pick<IGetOrganizationsRequest, "sort_by" | "sort_order">;
  handleSort: (
    sb: "created_at" | "updated_at",
    so: "asc" | "desc",
  ) => void;
  t: TFunction;
}) {
  const sortOrder = filters.sort_order ?? "desc";
  const active = filters.sort_by === sortBy;
  const displayOrder = active ? sortOrder : "desc";
  const Icon =
    displayOrder === "asc"
      ? HiOutlineSortAscending
      : HiOutlineSortDescending;
  const ariaLabel =
    sortBy === "created_at"
      ? displayOrder === "asc"
        ? t("Created at, ascending")
        : t("Created at, descending")
      : displayOrder === "asc"
        ? t("Updated at, ascending")
        : t("Updated at, descending");

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
      role="group"
      aria-label={fieldLabel}
    >
      <SortOptionButton
        active={active}
        icon={Icon}
        ariaLabel={ariaLabel}
        onClick={() => {
          if (active) {
            handleSort(sortBy, sortOrder === "asc" ? "desc" : "asc");
          } else {
            handleSort(sortBy, "desc");
          }
        }}
      />
      <span className="text-sm font-medium shrink-0 text-foreground-secondary">
        {fieldLabel}
      </span>
    </div>
  );
});

/** Matches incidents SearchSidebar card chrome */
const FILTER_PANEL_CLASS =
  "w-full space-y-2 p-6 border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 h-fit";

/** Same visual height for input, selects, and button (SelectTrigger defaults to !h-[50px]) */
const FILTER_CONTROL_H = "!h-11";

const SEARCH_INPUT_CLASS = cn(
  "pl-10 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 focus-visible:bg-white transition-all",
  FILTER_CONTROL_H,
);

const RESET_BUTTON_CLASS = cn(
  "w-full lg:w-auto border-dashed border-2 hover:border-primary hover:text-primary transition-all gap-2 shrink-0",
  FILTER_CONTROL_H,
);

export const OrganizationSearchFilters = memo(
  function OrganizationSearchFilters() {
    const { t } = useTranslation();
    const { filters, setFilters, resetFilters } = useOrganizationSearch();
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
      (updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      },
      [pathname, router, searchParams],
    );

    useEffect(() => {
      if (debouncedSearchValue !== filters.search) {
        setFilters({ search: debouncedSearchValue });
        updateURL({ search: debouncedSearchValue || undefined });
      }
    }, [debouncedSearchValue, filters.search, setFilters, updateURL]);

    const handleSort = useCallback(
      (sort_by: "created_at" | "updated_at", sort_order: "asc" | "desc") => {
        setFilters({ sort_by, sort_order });
        updateURL({ sort_by, sort_order });
      },
      [setFilters, updateURL],
    );

    const onReset = useCallback(() => {
      resetFilters();
      router.replace(pathname, { scroll: false });
    }, [pathname, resetFilters, router]);

    return (
      <div className={FILTER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-6">
          <Field className="flex-1 min-w-[200px]">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Search")}
            </FieldLabel>
            <div className="relative group">
              <TbZoom className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                className={SEARCH_INPUT_CLASS}
                placeholder={t("Name, description...")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </Field>

          <Field className="w-full lg:w-auto lg:min-w-0">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Sort")}
            </FieldLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              <SortFieldRow
                sortBy="created_at"
                fieldLabel={t("Created at")}
                filters={filters}
                handleSort={handleSort}
                t={t}
              />
              <SortFieldRow
                sortBy="updated_at"
                fieldLabel={t("Updated at")}
                filters={filters}
                handleSort={handleSort}
                t={t}
              />
            </div>
          </Field>

          <Button
            type="button"
            variant="outlined-brown"
            className={RESET_BUTTON_CLASS}
            onClick={onReset}
          >
            <span className="flex flex-row items-center justify-center gap-2">
              <TbZoomReset size={16} />
              {t("Reset")}
            </span>
          </Button>
        </div>
      </div>
    );
  },
);
