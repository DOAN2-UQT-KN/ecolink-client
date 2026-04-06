"use client";

import React, {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { useGetReports } from "@/apis/incident/getReport";
import { IIncident } from "@/apis/incident/models/incident";
import { IGetReportsRequest } from "@/apis/incident/models/getReport";
import useGetParam from "@/hooks/useGetParam";

interface IncidentSearchContextType {
  reports: IIncident[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  filters: Partial<IGetReportsRequest>;
  setFilters: (filters: Partial<IGetReportsRequest>) => void;
  resetFilters: () => void;
  refetch: () => void;
}

export const IncidentSearchContext = createContext<
  IncidentSearchContextType | undefined
>(undefined);

export const IncidentSearchProvider = ({ children }: { children: ReactNode }) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<number>("status", "number", undefined);
  const urlWasteType = useGetParam<string>("waste_type", "string", "");
  const urlSeverity = useGetParam<number>("severity_level", "number", undefined);

  const [filters, setFiltersState] = useState<Partial<IGetReportsRequest>>({
    search: urlSearch,
    status: urlStatus,
    waste_type: urlWasteType,
    severity_level: urlSeverity,
  });

  useEffect(() => {
    setFiltersState({
      search: urlSearch,
      status: urlStatus,
      waste_type: urlWasteType,
      severity_level: urlSeverity,
    });
  }, [urlSearch, urlStatus, urlWasteType, urlSeverity]);

  const setFilters = useCallback((newFilters: Partial<IGetReportsRequest>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      search: "",
      status: undefined,
      waste_type: "",
      severity_level: undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSetPagination = useCallback(
    (newPagination: { current: number; pageSize: number }) => {
      setPagination(newPagination);
    },
    [],
  );

  const { data, isLoading, refetch } = useGetReports({
    page: pagination.current,
    limit: pagination.pageSize,
    ...filters,
  });

  const reports = React.useMemo(() => data?.data?.reports || [], [data]);
  const total = React.useMemo(
    () => (data as any)?.data?.total || reports.length,
    [data, reports.length],
  );

  const contextValue = React.useMemo(
    () => ({
      reports,
      isLoading,
      total,
      pagination,
      setPagination: handleSetPagination,
      filters,
      setFilters,
      resetFilters,
      refetch,
    }),
    [
      reports,
      isLoading,
      total,
      pagination,
      handleSetPagination,
      filters,
      setFilters,
      resetFilters,
      refetch,
    ],
  );

  return (
    <IncidentSearchContext.Provider value={contextValue}>
      {children}
    </IncidentSearchContext.Provider>
  );
};

export const useIncidentSearch = () => {
  const context = useContext(IncidentSearchContext);
  if (context === undefined) {
    throw new Error(
      "useIncidentSearch must be used within an IncidentSearchProvider",
    );
  }
  return context;
};
