"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useGetGifts } from "@/apis/gift/getGifts";
import type { IGift, IGetGiftsRequest } from "@/apis/gift/models/gift";
import useGetParam from "@/hooks/useGetParam";

export type GiftFormFilterValues = {
  search: string;
  /** URL: omit = all gifts; admin sees inactive too */
  activeFilter: "all" | "active" | "inactive";
  stockFilter: "all" | "in_stock";
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type GiftContextType = {
  filters: GiftFormFilterValues;
  pagination: PaginationState;
  gifts: IGift[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<GiftFormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const GiftContext = createContext<GiftContextType | undefined>(undefined);

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

function parseActiveFilter(value: string | undefined): GiftFormFilterValues["activeFilter"] {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function parseStockFilter(value: string | undefined): GiftFormFilterValues["stockFilter"] {
  if (value === "in_stock") return "in_stock";
  return "all";
}

export function GiftProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlActive = useGetParam<string>("active", "string", "");
  const urlStock = useGetParam<string>("stock", "string", "");
  const urlPage = useGetParam<number>("page", "number", 1);
  const urlLimit = useGetParam<number>("limit", "number", 10);

  const [filters, setFilters] = useState<GiftFormFilterValues>({
    search: urlSearch ?? "",
    activeFilter: parseActiveFilter(urlActive ?? undefined),
    stockFilter: parseStockFilter(urlStock ?? undefined),
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    const nextFilters: GiftFormFilterValues = {
      search: urlSearch ?? "",
      activeFilter: parseActiveFilter(urlActive ?? undefined),
      stockFilter: parseStockFilter(urlStock ?? undefined),
    };
    setFilters((prev) => {
      if (
        prev.search === nextFilters.search &&
        prev.activeFilter === nextFilters.activeFilter &&
        prev.stockFilter === nextFilters.stockFilter
      ) {
        return prev;
      }
      return nextFilters;
    });

    const nextPagination: PaginationState = {
      current: Math.max(1, urlPage ?? 1),
      pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
    };
    setPagination((prev) => {
      if (prev.current === nextPagination.current && prev.pageSize === nextPagination.pageSize) {
        return prev;
      }
      return nextPagination;
    });
  }, [urlActive, urlLimit, urlPage, urlSearch, urlStock]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
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
    [pathname, router],
  );

  const request: IGetGiftsRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search.trim() || undefined,
      isActive:
        filters.activeFilter === "all"
          ? undefined
          : filters.activeFilter === "active",
      inStock: filters.stockFilter === "in_stock" ? true : undefined,
    }),
    [filters.activeFilter, filters.search, filters.stockFilter, pagination],
  );

  const { data, isLoading } = useGetGifts(request);

  const gifts = data?.data?.gifts ?? [];
  const total = data?.data?.meta?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<GiftFormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        const search = merged.search.trim();
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          search: search || undefined,
          active: merged.activeFilter === "all" ? undefined : merged.activeFilter,
          stock: merged.stockFilter === "all" ? undefined : merged.stockFilter,
          page: "1",
        });
        return { ...merged, search };
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    const reset: GiftFormFilterValues = {
      search: "",
      activeFilter: "all",
      stockFilter: "all",
    };
    setFilters(reset);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({
      search: undefined,
      active: undefined,
      stock: undefined,
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

  const onPageSizeChange = useCallback(
    (nextSize: number) => {
      const pageSize = Math.max(1, Math.floor(nextSize));
      setPagination((prev) => ({ ...prev, pageSize, current: 1 }));
      setParams({ limit: String(pageSize), page: "1" });
    },
    [setParams],
  );

  const value = useMemo(
    () => ({
      filters,
      pagination,
      gifts,
      total,
      loading: isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    }),
    [
      filters,
      pagination,
      gifts,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
}

export function useGiftContext() {
  const ctx = useContext(GiftContext);
  if (!ctx) {
    throw new Error("useGiftContext must be used within GiftProvider");
  }
  return ctx;
}
