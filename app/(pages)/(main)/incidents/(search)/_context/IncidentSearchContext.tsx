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
import { STATUS } from "@/constants/status";

export const INCIDENT_SEARCH_ALL_STATUSES = [
  STATUS.TODO,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
];

export function incidentSearchStatusesFromUrl(
  urlStatus: string | undefined,
): number[] {
  if (!urlStatus) {
    return [STATUS.TODO];
  }
  if (urlStatus === "all") {
    return [...INCIDENT_SEARCH_ALL_STATUSES];
  }
  const parsed = Number(urlStatus);
  if (Number.isInteger(parsed)) {
    return [parsed];
  }
  return [STATUS.TODO];
}

export function incidentSearchSelectValue(
  statuses: number[] | undefined,
): string {
  if (!statuses || statuses.length === 0) {
    return String(STATUS.TODO);
  }
  if (
    statuses.length === INCIDENT_SEARCH_ALL_STATUSES.length &&
    INCIDENT_SEARCH_ALL_STATUSES.every((status) => statuses.includes(status))
  ) {
    return "all";
  }
  return String(statuses[0]);
}

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
  const urlStatus = useGetParam<string>("status", "string", undefined);
  const urlWasteType = useGetParam<string>("waste_type", "string", "");
  const urlSeverity = useGetParam<number>("severity_level", "number", undefined);

  const [filters, setFiltersState] = useState<Partial<IGetReportsRequest>>({
    search: urlSearch,
    statuses: incidentSearchStatusesFromUrl(urlStatus),
    waste_type: urlWasteType,
    severity_level: urlSeverity,
  });

  useEffect(() => {
    setFiltersState({
      search: urlSearch,
      statuses: incidentSearchStatusesFromUrl(urlStatus),
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
      statuses: [STATUS.TODO],
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
    () => data?.data?.total ?? reports.length,
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
