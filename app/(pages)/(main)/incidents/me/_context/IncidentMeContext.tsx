"use client";

import React, { createContext, ReactNode, useState, useCallback, useEffect } from "react";
import { useGetMyReports } from "@/apis/incident/getReport";
import { IIncident } from "@/apis/incident/models/incident";
import { IGetReportsRequest } from "@/apis/incident/models/getReport";
import useGetParam from "@/hooks/useGetParam";

interface IncidentMeContextType {
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
  refetch: () => void;
}

export const IncidentMeContext = createContext<
  IncidentMeContextType | undefined
>(undefined);

export const IncidentMeProvider = ({ children }: { children: ReactNode }) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<number>("status", "number", undefined);

  const [filters, setFiltersState] = useState<Partial<IGetReportsRequest>>({
    search: urlSearch,
    status: urlStatus,
  });

  useEffect(() => {
    setFiltersState({
      search: urlSearch,
      status: urlStatus,
    });
  }, [urlSearch, urlStatus]);

  const setFilters = useCallback((newFilters: Partial<IGetReportsRequest>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const { data, isLoading, refetch } = useGetMyReports({
    page: pagination.current,
    limit: pagination.pageSize,
    ...filters,
  });

  const reports = data?.data?.reports || [];
  const total = (data as any)?.data?.total || reports.length;

  return (
    <IncidentMeContext.Provider
      value={{
        reports,
        isLoading,
        total,
        pagination,
        setPagination,
        filters,
        setFilters,
        refetch,
      }}
    >
      {children}
    </IncidentMeContext.Provider>
  );
};

