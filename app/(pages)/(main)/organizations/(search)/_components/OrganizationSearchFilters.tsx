"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { TbZoom, TbZoomReset } from "react-icons/tb";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/shared/Button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useDebounce } from "@/hooks/useDebounce";
import { useOrganizationSearch } from "../_context/OrganizationSearchContext";

const SEARCH_INPUT_CLASS =
  "pl-10 h-11 border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50 focus-visible:bg-white transition-all";

const SELECT_TRIGGER_CLASS =
  "w-full min-w-[140px] border-1 border-[rgba(136,122,71,0.5)] focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50 bg-white/50";

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

    const handleSortByChange = useCallback(
      (value: string) => {
        const sort_by = value as "created_at" | "updated_at";
        setFilters({ sort_by });
        updateURL({ sort_by });
      },
      [setFilters, updateURL],
    );

    const handleSortOrderChange = useCallback(
      (value: string) => {
        const sort_order = value as "asc" | "desc";
        setFilters({ sort_order });
        updateURL({ sort_order });
      },
      [setFilters, updateURL],
    );

    const onReset = useCallback(() => {
      resetFilters();
      router.replace(pathname, { scroll: false });
    }, [pathname, resetFilters, router]);

    return (
      <div className="w-full space-y-4 pt-2 border-b border-[rgba(136,122,71,0.25)] pb-6">
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

          <Field className="w-full lg:w-auto lg:min-w-[200px]">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Sort by")}
            </FieldLabel>
            <Select
              value={filters.sort_by ?? "created_at"}
              onValueChange={handleSortByChange}
            >
              <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                <SelectValue placeholder={t("Sort by")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">{t("Created at")}</SelectItem>
                <SelectItem value="updated_at">{t("Updated at")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-full lg:w-auto lg:min-w-[160px]">
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Order")}
            </FieldLabel>
            <Select
              value={filters.sort_order ?? "desc"}
              onValueChange={handleSortOrderChange}
            >
              <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                <SelectValue placeholder={t("Order")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t("Ascending")}</SelectItem>
                <SelectItem value="desc">{t("Descending")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Button
            type="button"
            variant="outlined-brown"
            className="w-full lg:w-auto h-11 border-dashed border-2 hover:border-primary hover:text-primary transition-all gap-2 shrink-0"
            onClick={onReset}
          >
            <span className="flex flex-row items-center justify-center gap-2">
              <TbZoomReset size={16} />
              {t("Reset Filters")}
            </span>
          </Button>
        </div>
      </div>
    );
  },
);
