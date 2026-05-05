"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetAdminSeasons } from "@/apis/gamification/season/list";
import type { ISeason } from "@/apis/gamification/season/models";
import {
  normalizeSeasonPageSize,
  type SeasonFilterValues,
} from "../_services/seasonAdmin.service";

type PaginationState = {
  current: number;
  pageSize: number;
};

export type SeasonContextType = {
  filters: SeasonFilterValues;
  pagination: PaginationState;
  seasons: ISeason[];
  total: number;
  loading: boolean;
  errorMessage: string | undefined;
  onRetry: () => void;
  onFilterChange: (next: Partial<SeasonFilterValues>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<SeasonFilterValues>({
    search: "",
    kind: "",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
  });

  const request = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    }),
    [filters.kind, filters.search, pagination.current, pagination.pageSize],
  );

  const query = useGetAdminSeasons(request);
  const seasons = query.data?.data?.seasons ?? [];
  const total = query.data?.data?.total ?? 0;

  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [filters.kind, filters.search]);

  const onFilterChange = useCallback((next: Partial<SeasonFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, current: Math.max(1, page) }));
  }, []);

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination({
      current: 1,
      pageSize: normalizeSeasonPageSize(pageSize),
    });
  }, []);

  const value = useMemo<SeasonContextType>(
    () => ({
      filters,
      pagination,
      seasons,
      total,
      loading: query.isLoading,
      errorMessage: query.isError ? t("Failed to load seasons") : undefined,
      onRetry: () => void query.refetch(),
      onFilterChange,
      onPageChange,
      onPageSizeChange,
    }),
    [
      filters,
      onFilterChange,
      onPageChange,
      onPageSizeChange,
      pagination,
      query.isError,
      query.isLoading,
      query.refetch,
      seasons,
      t,
      total,
    ],
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}
