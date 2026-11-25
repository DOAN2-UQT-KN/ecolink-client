import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useGetGridCells } from "@/apis/grid-cell/getGridCells";
import type {
  GridCellSort,
  IGetGridCellsRequest,
  IGridCell,
} from "@/apis/grid-cell/models/gridCell";

export type GridCellFilters = {
  sort: GridCellSort;
  minReports: number;
  onlyCleaned: boolean;
};

type PaginationState = { current: number; pageSize: number };

type GridCellContextValue = {
  filters: GridCellFilters;
  pagination: PaginationState;
  cells: IGridCell[];
  total: number;
  loading: boolean;
  onFilterChange: (patch: Partial<GridCellFilters>) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const DEFAULT_FILTERS: GridCellFilters = {
  sort: "submitted",
  minReports: 0,
  onlyCleaned: false,
};

const GridCellContext = createContext<GridCellContextValue | null>(null);

export function GridCellProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<GridCellFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
  });

  const request: IGetGridCellsRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      sort: filters.sort,
      min_reports: filters.minReports > 0 ? filters.minReports : undefined,
      only_cleaned: filters.onlyCleaned || undefined,
    }),
    [filters, pagination],
  );

  const { data, isLoading } = useGetGridCells(request);
  const cells = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;

  // Changing any filter always goes back to page 1.
  const onFilterChange = useCallback((patch: Partial<GridCellFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const onResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
  }, []);

  const onPageSizeChange = useCallback((size: number) => {
    setPagination({ current: 1, pageSize: size });
  }, []);

  const value = useMemo(
    () => ({
      filters,
      pagination,
      cells,
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
      cells,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return (
    <GridCellContext.Provider value={value}>
      {children}
    </GridCellContext.Provider>
  );
}

export function useGridCellContext() {
  const ctx = useContext(GridCellContext);
  if (!ctx) {
    throw new Error("useGridCellContext must be used within GridCellProvider");
  }
  return ctx;
}
