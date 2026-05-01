"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useGetAdminGamificationBadges } from "@/apis/gamification/getGamificationBadges";
import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";

export type BadgeAdminFilterValues = {
  search: string;
  /** Maps to API `includeInactive` (backend includes soft-deleted definitions when true). */
  includeInactive: boolean;
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type BadgeAdminContextType = {
  filters: BadgeAdminFilterValues;
  pagination: PaginationState;
  badges: IAdminBadgeDefinition[];
  total: number;
  loading: boolean;
  errorMessage: string | undefined;
  onRetry: () => void;
  onFilterChange: (next: Partial<BadgeAdminFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const BadgeAdminContext = createContext<BadgeAdminContextType | undefined>(
  undefined,
);

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? limit
    : 10;
}

export function BadgeAdminProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<BadgeAdminFilterValues>({
    search: "",
    includeInactive: false,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
  });

  const query = useGetAdminGamificationBadges({
    includeInactive: filters.includeInactive ? true : undefined,
  });

  const rawBadges = query.data?.data?.badges ?? [];

  const filteredBadges = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return rawBadges;
    return rawBadges.filter((b) => {
      const sym = b.symbol?.toLowerCase() ?? "";
      return (
        b.slug.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        sym.includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [rawBadges, filters.search]);

  const total = filteredBadges.length;

  const badges = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredBadges.slice(start, start + pagination.pageSize);
  }, [filteredBadges, pagination.current, pagination.pageSize]);

  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [filters.search, filters.includeInactive]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);
    if (pagination.current > maxPage) {
      setPagination((p) => ({ ...p, current: maxPage }));
    }
  }, [pagination.current, pagination.pageSize, total]);

  const onFilterChange = useCallback((next: Partial<BadgeAdminFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const onResetFilters = useCallback(() => {
    setFilters({ search: "", includeInactive: false });
    setPagination((p) => ({ ...p, current: 1 }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, current: Math.max(1, page) }));
  }, []);

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination({
      current: 1,
      pageSize: normalizePageSize(pageSize),
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
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    }),
    [
      badges,
      filters,
      onFilterChange,
      onPageChange,
      onPageSizeChange,
      onResetFilters,
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

export function useBadgeAdminContext(): BadgeAdminContextType {
  const ctx = useContext(BadgeAdminContext);
  if (!ctx) {
    throw new Error("useBadgeAdminContext must be used within BadgeAdminProvider");
  }
  return ctx;
}
