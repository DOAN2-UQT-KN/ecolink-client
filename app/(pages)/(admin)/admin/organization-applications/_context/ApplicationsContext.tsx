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

import { useGetAdminApplications } from "@/apis/organization-application/adminApplications";
import type { IGetAdminApplicationsRequest } from "@/apis/organization-application/models/adminApplications";
import type {
  ApplicationLane,
  ApplicationStatus,
  IAdminApplication,
  OrgType,
} from "@/apis/organization-application/models/application";
import useGetParam from "@/hooks/useGetParam";

export type ApplicationFilterValues = {
  search: string;
  status: string;
  orgType: string;
  lane: string;
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type ApplicationsContextType = {
  filters: ApplicationFilterValues;
  pagination: PaginationState;
  applications: IAdminApplication[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<ApplicationFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(
  undefined,
);

/** Must match the shared DataTable page size options so its Select stays in sync. */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? limit
    : 10;
}

const DEFAULT_FILTERS: ApplicationFilterValues = {
  search: "",
  // Reviewers land on the queue, not on the archive.
  status: "open",
  orgType: "all",
  lane: "all",
};

/**
 * `open` is a UI shorthand for the statuses that still need a decision. Drafts and
 * applications still waiting on owner confirmations never reach this console at all.
 */
const OPEN_STATUSES: ApplicationStatus[] = ["PENDING_REVIEW", "NEEDS_REVISION"];

export function ApplicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const urlSearch = useGetParam<string>("q", "string", "");
  const urlStatus = useGetParam<string>("status", "string", "open");
  const urlOrgType = useGetParam<string>("org_type", "string", "all");
  const urlLane = useGetParam<string>("lane", "string", "all");
  const urlPage = useGetParam<number>("page", "number", 1);
  const urlLimit = useGetParam<number>("limit", "number", 10);

  const [filters, setFilters] = useState<ApplicationFilterValues>({
    search: urlSearch ?? "",
    status: urlStatus ?? "open",
    orgType: urlOrgType ?? "all",
    lane: urlLane ?? "all",
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    setFilters((prev) => {
      const next: ApplicationFilterValues = {
        search: urlSearch ?? "",
        status: urlStatus ?? "open",
        orgType: urlOrgType ?? "all",
        lane: urlLane ?? "all",
      };
      const unchanged =
        prev.search === next.search &&
        prev.status === next.status &&
        prev.orgType === next.orgType &&
        prev.lane === next.lane;
      return unchanged ? prev : next;
    });

    setPagination((prev) => {
      const next: PaginationState = {
        current: Math.max(1, urlPage ?? 1),
        pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
      };
      return prev.current === next.current && prev.pageSize === next.pageSize
        ? prev
        : next;
    });
  }, [urlLane, urlLimit, urlOrgType, urlPage, urlSearch, urlStatus]);

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

  const request: IGetAdminApplicationsRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      q: filters.search.trim() || undefined,
      status:
        filters.status === "all"
          ? undefined
          : filters.status === "open"
            ? OPEN_STATUSES
            : (filters.status as ApplicationStatus),
      org_type:
        filters.orgType === "all" ? undefined : (filters.orgType as OrgType),
      lane: filters.lane === "all" ? undefined : (filters.lane as ApplicationLane),
    }),
    [filters.lane, filters.orgType, filters.search, filters.status, pagination],
  );

  const { data, isLoading } = useGetAdminApplications(request);

  const applications = data?.data?.applications ?? [];
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<ApplicationFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        const search = merged.search.trim();
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          q: search || undefined,
          status: merged.status === "open" ? undefined : merged.status,
          org_type: merged.orgType === "all" ? undefined : merged.orgType,
          lane: merged.lane === "all" ? undefined : merged.lane,
          page: "1",
        });
        return { ...merged, search };
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({
      q: undefined,
      status: undefined,
      org_type: undefined,
      lane: undefined,
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
      applications,
      total,
      loading: isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    }),
    [
      applications,
      filters,
      isLoading,
      onFilterChange,
      onPageChange,
      onPageSizeChange,
      onResetFilters,
      pagination,
      total,
    ],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplicationsContext() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error(
      "useApplicationsContext must be used within ApplicationsProvider",
    );
  }
  return context;
}
