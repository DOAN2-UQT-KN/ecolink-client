"use client";

import React, {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetOrganizations } from "@/apis/organization/getOrganizations";
import { useGetMyOrganizations } from "@/apis/organization/getMyOrganizations";
import type { IOrganization } from "@/apis/organization/models/organization";
import type { IGetOrganizationsRequest } from "@/apis/organization/models/getOrganizations";
import type { IGetMyOrganizationsRequest } from "@/apis/organization/models/getMyOrganizations";
import { STATUS } from "@/constants/status";
import useGetParam from "@/hooks/useGetParam";

function parseSortBy(
  v: string | undefined,
): NonNullable<IGetOrganizationsRequest["sort_by"]> {
  if (v === "updated_at" || v === "created_at") return v;
  return "created_at";
}

function parseSortOrder(
  v: string | undefined,
): NonNullable<IGetOrganizationsRequest["sort_order"]> {
  if (v === "asc" || v === "desc") return v;
  return "desc";
}

export type OrganizationSearchViewMode = "explore" | "mine";

interface OrganizationSearchContextType {
  organizations: IOrganization[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  viewMode: OrganizationSearchViewMode;
  setViewMode: (mode: OrganizationSearchViewMode) => void;
  filters: Pick<
    IGetOrganizationsRequest,
    "search" | "sort_by" | "sort_order"
  >;
  setFilters: (
    filters: Partial<
      Pick<IGetOrganizationsRequest, "search" | "sort_by" | "sort_order">
    >,
  ) => void;
  resetFilters: () => void;
  refetch: () => void;
}

export const OrganizationSearchContext = createContext<
  OrganizationSearchContextType | undefined
>(undefined);

export const OrganizationSearchProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
  });

  const urlTab = useGetParam<string>("tab", "string", undefined);
  const viewMode: OrganizationSearchViewMode =
    urlTab === "mine" ? "mine" : "explore";

  const setViewMode = useCallback(
    (mode: OrganizationSearchViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "mine") {
        params.set("tab", "mine");
      } else {
        params.delete("tab");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [pathname, router, searchParams],
  );

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlSortBy = useGetParam<string>("sort_by", "string", undefined);
  const urlSortOrder = useGetParam<string>("sort_order", "string", undefined);

  const [filters, setFiltersState] = useState<
    Pick<IGetOrganizationsRequest, "search" | "sort_by" | "sort_order">
  >({
    search: urlSearch ?? "",
    sort_by: parseSortBy(urlSortBy),
    sort_order: parseSortOrder(urlSortOrder),
  });

  useEffect(() => {
    setFiltersState({
      search: urlSearch ?? "",
      sort_by: parseSortBy(urlSortBy),
      sort_order: parseSortOrder(urlSortOrder),
    });
  }, [urlSearch, urlSortBy, urlSortOrder]);

  const setFilters = useCallback(
    (
      newFilters: Partial<
        Pick<IGetOrganizationsRequest, "search" | "sort_by" | "sort_order">
      >,
    ) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFiltersState({
      search: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSetPagination = useCallback(
    (newPagination: { current: number; pageSize: number }) => {
      setPagination(newPagination);
    },
    [],
  );

  const listRequest: IGetOrganizationsRequest =
    {
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search?.trim() || undefined,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      is_email_verified: true,
      status: STATUS.APPROVED,
    };

  const myListRequest: IGetMyOrganizationsRequest = {
    page: pagination.current,
    limit: pagination.pageSize,
    search: filters.search?.trim() || undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  const exploreQuery = useGetOrganizations(listRequest, {
    enabled: viewMode === "explore",
  });
  const myQuery = useGetMyOrganizations(myListRequest, {
    enabled: viewMode === "mine",
  });

  const data = viewMode === "mine" ? myQuery.data : exploreQuery.data;
  const isLoading = viewMode === "mine" ? myQuery.isLoading : exploreQuery.isLoading;
  const refetch = viewMode === "mine" ? myQuery.refetch : exploreQuery.refetch;

  const organizations = React.useMemo(
    () => data?.data?.organizations ?? [],
    [data],
  );

  const total = React.useMemo(() => data?.data?.total ?? 0, [data]);

  const contextValue = React.useMemo(
    () => ({
      organizations,
      isLoading,
      total,
      pagination,
      setPagination: handleSetPagination,
      viewMode,
      setViewMode,
      filters,
      setFilters,
      resetFilters,
      refetch,
    }),
    [
      organizations,
      isLoading,
      total,
      pagination,
      handleSetPagination,
      viewMode,
      setViewMode,
      filters,
      setFilters,
      resetFilters,
      refetch,
    ],
  );

  return (
    <OrganizationSearchContext.Provider value={contextValue}>
      {children}
    </OrganizationSearchContext.Provider>
  );
};

export const useOrganizationSearch = () => {
  const context = useContext(OrganizationSearchContext);
  if (context === undefined) {
    throw new Error(
      "useOrganizationSearch must be used within an OrganizationSearchProvider",
    );
  }
  return context;
};
