import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";

import { useGetIncidents } from "@/apis/incident/getIncidents";
import type { IGetReportsRequest } from "@/apis/incident/models/getReport";
import type { IIncident, SortBy } from "@/apis/incident/models/incident";
import { SortOrder } from "@/apis/incident/models/incident";
import useGetParam from "@/hooks/useGetParam";

export type IncidentFormFilterValues = {
  search: string;
  status: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type IncidentContextType = {
  filters: IncidentFormFilterValues;
  pagination: PaginationState;
  incidents: IIncident[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<IncidentFormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

/**
 * The moderation filters (specs/008) share the Status select: `moderation:REVIEW|REJECT`.
 * On the URL they are `moderation=…` (no `status`), so old queue links map straight onto them.
 */
export const MODERATION_STATUS_PREFIX = "moderation:";

export function moderationOf(status: string): "REVIEW" | "REJECT" | undefined {
  const value = status.startsWith(MODERATION_STATUS_PREFIX) ? status.slice(MODERATION_STATUS_PREFIX.length) : "";
  return value === "REVIEW" || value === "REJECT" ? value : undefined;
}

function statusFromUrl(status: string | undefined, moderation: string | undefined): string {
  return moderation === "REVIEW" || moderation === "REJECT" ? `${MODERATION_STATUS_PREFIX}${moderation}` : status ?? "all";
}

/** URL params for a status filter value: either `status` or `moderation`, never both. */
function statusParams(status: string): { status?: string; moderation?: string } {
  const moderation = moderationOf(status);
  if (moderation) return { status: undefined, moderation };
  return { status: status === "all" ? undefined : status, moderation: undefined };
}

function parseSortBy(value: string | undefined): SortBy {
  if (value === "updated_at" || value === "name" || value === "created_at") {
    return value;
  }
  if (value === "severity_level" || value === "distance") {
    return value;
  }
  return "created_at";
}

function parseSortOrder(value: string | undefined): SortOrder {
  if (value === "asc") return SortOrder.ASC;
  if (value === "desc") return SortOrder.DESC;
  return SortOrder.DESC;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<string>("status", "string", "all");
  const urlModeration = useGetParam<string>("moderation", "string", "");
  const urlSortBy = useGetParam<string>("sort_by", "string", "created_at");
  const urlSortOrder = useGetParam<string>("sort_order", "string", "desc");
  const urlPage = useGetParam<number>("page", "number", 1);
  const urlLimit = useGetParam<number>("limit", "number", 10);

  const [filters, setFilters] = useState<IncidentFormFilterValues>({
    search: urlSearch ?? "",
    status: statusFromUrl(urlStatus, urlModeration),
    sortBy: parseSortBy(urlSortBy),
    sortOrder: parseSortOrder(urlSortOrder),
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    const nextFilters: IncidentFormFilterValues = {
      search: urlSearch ?? "",
      status: statusFromUrl(urlStatus, urlModeration),
      sortBy: parseSortBy(urlSortBy),
      sortOrder: parseSortOrder(urlSortOrder),
    };
    setFilters((prev) => {
      if (
        prev.search === nextFilters.search &&
        prev.status === nextFilters.status &&
        prev.sortBy === nextFilters.sortBy &&
        prev.sortOrder === nextFilters.sortOrder
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
  }, [urlLimit, urlModeration, urlPage, urlSearch, urlSortBy, urlSortOrder, urlStatus]);

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

  const request: IGetReportsRequest = useMemo(() => {
    const base = { page: pagination.current, limit: pagination.pageSize, search: filters.search.trim() || undefined };
    const moderation = moderationOf(filters.status);
    // The server sorts the moderation filters by risk; status and sort do not apply.
    if (moderation) return { ...base, moderation };
    return {
      ...base,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      status: filters.status === "all" ? undefined : Number(filters.status),
    };
  },
    [filters.search, filters.sortBy, filters.sortOrder, filters.status, pagination],
  );

  const { data, isLoading } = useGetIncidents(request);

  const incidents = data?.data?.reports ?? [];
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<IncidentFormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        const search = merged.search.trim();
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          search: search || undefined,
          ...statusParams(merged.status),
          sort_by: merged.sortBy,
          sort_order: merged.sortOrder,
          page: "1",
        });
        return { ...merged, search };
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    const resetFilters: IncidentFormFilterValues = {
      search: "",
      status: "all",
      sortBy: "created_at",
      sortOrder: SortOrder.DESC,
    };
    setFilters(resetFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({
      search: undefined,
      status: undefined,
      moderation: undefined,
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
      incidents,
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
      incidents,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncidentContext() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidentContext must be used within IncidentProvider");
  }
  return context;
}
