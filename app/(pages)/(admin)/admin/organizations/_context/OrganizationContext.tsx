"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useGetOrganizations } from "@/apis/organization/getOrganizations";
import type { IGetOrganizationsRequest } from "@/apis/organization/models/getOrganizations";
import type { IOrganization } from "@/apis/organization/models/organization";
import useGetParam from "@/hooks/useGetParam";

export type FormFilterValues = {
  search: string;
  status: string;
  sortBy: "created_at" | "updated_at" | "name";
  sortOrder: "asc" | "desc";
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type OrganizationContextType = {
  filters: FormFilterValues;
  pagination: PaginationState;
  organizations: IOrganization[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<FormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

function parseSortBy(value: string | undefined): FormFilterValues["sortBy"] {
  if (value === "updated_at" || value === "name" || value === "created_at") {
    return value;
  }
  return "created_at";
}

function parseSortOrder(value: string | undefined): FormFilterValues["sortOrder"] {
  if (value === "asc" || value === "desc") {
    return value;
  }
  return "desc";
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<string>("status", "string", "all");
  const urlSortBy = useGetParam<string>("sort_by", "string", "created_at");
  const urlSortOrder = useGetParam<string>("sort_order", "string", "desc");
  const urlPage = useGetParam<number>("page", "number", 1);
  const urlLimit = useGetParam<number>("limit", "number", 10);

  const [filters, setFilters] = useState<FormFilterValues>({
    search: urlSearch ?? "",
    status: urlStatus ?? "all",
    sortBy: parseSortBy(urlSortBy),
    sortOrder: parseSortOrder(urlSortOrder),
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: Math.max(1, urlLimit ?? 10),
  });

  useEffect(() => {
    setFilters({
      search: urlSearch ?? "",
      status: urlStatus ?? "all",
      sortBy: parseSortBy(urlSortBy),
      sortOrder: parseSortOrder(urlSortOrder),
    });
    setPagination({
      current: Math.max(1, urlPage ?? 1),
      pageSize: Math.max(1, urlLimit ?? 10),
    });
  }, [urlLimit, urlPage, urlSearch, urlSortBy, urlSortOrder, urlStatus]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const request: IGetOrganizationsRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search.trim() || undefined,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      status: filters.status === "all" ? undefined : Number(filters.status),
    }),
    [filters.search, filters.sortBy, filters.sortOrder, filters.status, pagination],
  );

  const { data, isLoading } = useGetOrganizations(request);

  const organizations = data?.data?.organizations ?? [];
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<FormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          search: merged.search.trim() || undefined,
          status: merged.status === "all" ? undefined : merged.status,
          sort_by: merged.sortBy,
          sort_order: merged.sortOrder,
          page: "1",
        });
        return merged;
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    const resetFilters: FormFilterValues = {
      search: "",
      status: "all",
      sortBy: "created_at",
      sortOrder: "desc",
    };
    setFilters(resetFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({
      search: undefined,
      status: undefined,
      sort_by: undefined,
      sort_order: undefined,
      page: undefined,
    });
  }, [setParams]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      setPagination((prev) => ({ ...prev, current: nextPage }));
      setParams({ page: String(nextPage), limit: String(pagination.pageSize) });
    },
    [pagination.pageSize, setParams],
  );

  const value = useMemo(
    () => ({
      filters,
      pagination,
      organizations,
      total,
      loading: isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
    }),
    [
      filters,
      pagination,
      organizations,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
    ],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganizationContext must be used within OrganizationProvider");
  }
  return context;
}
