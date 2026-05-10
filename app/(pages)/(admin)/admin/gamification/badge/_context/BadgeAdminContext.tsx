"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useGetAdminGamificationBadges } from "@/apis/gamification/badges/list";
import type { IAdminBadgeDefinition } from "@/apis/gamification/badges/models";
import {
  filterBadges,
  normalizeBadgePageSize,
  paginateBadges,
} from "../_services/badgeAdmin.service";

export type BadgeAdminFilterValues = {
  search: string;
};

type PaginationState = {
  current: number;
  pageSize: number;
};

export type BadgeAdminContextType = {
  filters: BadgeAdminFilterValues;
  pagination: PaginationState;
  badges: IAdminBadgeDefinition[];
  total: number;
  loading: boolean;
  errorMessage: string | undefined;
  onRetry: () => void;
  onFilterChange: (next: Partial<BadgeAdminFilterValues>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const BadgeAdminContext = createContext<BadgeAdminContextType | undefined>(
  undefined,
);

export function BadgeAdminProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<BadgeAdminFilterValues>({
    search: "",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
  });

  const query = useGetAdminGamificationBadges({});

  const rawBadges = query.data?.data?.badges ?? [];

  const filteredBadges = useMemo(
    () => filterBadges(rawBadges, filters),
    [filters, rawBadges],
  );

  const total = filteredBadges.length;

  const badges = useMemo(
    () => paginateBadges(filteredBadges, pagination.current, pagination.pageSize),
    [filteredBadges, pagination.current, pagination.pageSize],
  );

  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [filters.search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);
    if (pagination.current > maxPage) {
      setPagination((p) => ({ ...p, current: maxPage }));
    }
  }, [pagination.current, pagination.pageSize, total]);

  const onFilterChange = useCallback((next: Partial<BadgeAdminFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, current: Math.max(1, page) }));
  }, []);

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination({
      current: 1,
      pageSize: normalizeBadgePageSize(pageSize),
    });
  }, []);

  const value = useMemo<BadgeAdminContextType>(
    () => ({
      filters,
      pagination,
      badges,
      total,
      loading: query.isLoading,
      errorMessage: query.isError ? t("Failed to load badges") : undefined,
      onRetry: () => void query.refetch(),
      onFilterChange,
      onPageChange,
      onPageSizeChange,
    }),
    [
      badges,
      filters,
      onFilterChange,
      onPageChange,
      onPageSizeChange,
      pagination,
      query.isError,
      query.isLoading,
      query.refetch,
      t,
      total,
    ],
  );

  return (
    <BadgeAdminContext.Provider value={value}>
      {children}
    </BadgeAdminContext.Provider>
  );
}
