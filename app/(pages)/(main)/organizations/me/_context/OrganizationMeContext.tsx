"use client";

import React, {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useGetMyOrganizations } from "@/apis/organization/getMyOrganizations";
import { IOrganization } from "@/apis/organization/models/organization";
import { IGetMyOrganizationsRequest } from "@/apis/organization/models/getMyOrganizations";
import useGetParam from "@/hooks/useGetParam";

export interface OrganizationMeContextType {
  organizations: IOrganization[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  filters: Partial<IGetMyOrganizationsRequest>;
  setFilters: (filters: Partial<IGetMyOrganizationsRequest>) => void;
  refetch: () => void;
}

export const OrganizationMeContext = createContext<
  OrganizationMeContextType | undefined
>(undefined);

export const OrganizationMeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<number>("status", "number", undefined);

  const [filters, setFiltersState] = useState<
    Partial<IGetMyOrganizationsRequest>
  >({
    search: urlSearch,
    status: urlStatus,
  });

  useEffect(() => {
    // Sync URL query into filters (e.g. browser back/forward).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL → filter sync
    setFiltersState({
      search: urlSearch,
      status: urlStatus,
    });
  }, [urlSearch, urlStatus]);

  const setFilters = useCallback(
    (newFilters: Partial<IGetMyOrganizationsRequest>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [],
  );

  const handleSetPagination = useCallback(
    (newPagination: { current: number; pageSize: number }) => {
      setPagination(newPagination);
    },
    [],
  );

  const { data, isLoading, refetch } = useGetMyOrganizations({
    page: pagination.current,
    limit: pagination.pageSize,
    is_owner: true,
    ...filters,
  });

  const organizations = React.useMemo(
    () => data?.data?.organizations ?? [],
    [data],
  );

  const total = React.useMemo(() => {
    const t = data?.data?.total;
    return typeof t === "number" ? t : organizations.length;
  }, [data, organizations.length]);

  const contextValue = React.useMemo(
    () => ({
      organizations,
      isLoading,
      total,
      pagination,
      setPagination: handleSetPagination,
      filters,
      setFilters,
      refetch,
    }),
    [
      organizations,
      isLoading,
      total,
      pagination,
      handleSetPagination,
      filters,
      setFilters,
      refetch,
    ],
  );

  return (
    <OrganizationMeContext.Provider value={contextValue}>
      {children}
    </OrganizationMeContext.Provider>
  );
};
