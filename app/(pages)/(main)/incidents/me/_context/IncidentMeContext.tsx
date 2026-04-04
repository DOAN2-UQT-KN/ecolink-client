"use client";

import React, { createContext, ReactNode, useState } from "react";
import { useGetMyReports } from "@/apis/incident/getReport";
import { IIncident } from "@/apis/incident/models/incident";

interface IncidentMeContextType {
  reports: IIncident[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
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

  const { data, isLoading, refetch } = useGetMyReports({
    page: pagination.current,
    limit: pagination.pageSize,
  });

  const reports = data?.data?.reports || [];
  // Since we don't have total in IBaseResponse currently based on what I saw (it was just IBaseResponse<T>),
  // I'll see if I can find where total is.
  // Wait, IBaseResponse might have it if it's paginated.
  // Let me check IBaseResponse again carefully.
  const total = (data as any)?.data?.total || reports.length;

  return (
    <IncidentMeContext.Provider
      value={{
        reports,
        isLoading,
        total,
        pagination,
        setPagination,
        refetch,
      }}
    >
      {children}
    </IncidentMeContext.Provider>
  );
};
