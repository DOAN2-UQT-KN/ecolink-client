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

import { useGetUsers } from "@/apis/user/getUsers";
import type { IGetUsersRequest } from "@/apis/user/models/getUsers";
import type { IAdminUser } from "@/apis/user/models/getUsers";
import useGetParam from "@/hooks/useGetParam";

export type FormFilterValues = {
  search: string;
  status: string;
  sortBy: "created_at" | "name" | "email";
  sortOrder: "asc" | "desc";
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type UserContextType = {
  filters: FormFilterValues;
  pagination: PaginationState;
  users: IAdminUser[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<FormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function parseSortBy(value: string | undefined): FormFilterValues["sortBy"] {
  if (value === "name" || value === "email" || value === "created_at") {
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

/** Must match shared DataTable default page size options so the table Select stays in sync. */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

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
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    const nextFilters: FormFilterValues = {
      search: urlSearch ?? "",
      status: urlStatus ?? "all",
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
  }, [urlLimit, urlPage, urlSearch, urlSortBy, urlSortOrder, urlStatus]);

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

  const request: IGetUsersRequest = useMemo(
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

  const { data, isLoading } = useGetUsers(request);

  const users = data?.data?.users ?? [];
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<FormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        const search = merged.search.trim();
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          search: search || undefined,
          status: merged.status === "all" ? undefined : merged.status,
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
      users,
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
      users,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
}
