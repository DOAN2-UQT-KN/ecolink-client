"use client";

import debounce from "lodash.debounce";
import { useEffect, useMemo, useState } from "react";
import type { FilterState } from "../types";

type UseTableStateParams = {
  externalSearch?: string;
  onSearchChange?: (value: string) => void;
  debounceMs?: number;
  initialFilters: FilterState;
  onFilterChange?: (values: FilterState) => void;
};

function parseFilterState(snapshot: string): FilterState {
  try {
    return JSON.parse(snapshot) as FilterState;
  } catch {
    return {};
  }
}

export const useTableState = ({
  externalSearch,
  onSearchChange,
  debounceMs = 350,
  initialFilters,
  onFilterChange,
}: UseTableStateParams) => {
  const initialFiltersSnapshot = useMemo(
    () => JSON.stringify(initialFilters),
    [initialFilters],
  );

  const [localSearch, setLocalSearch] = useState(externalSearch ?? "");
  const [localFilters, setLocalFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    setLocalSearch(externalSearch ?? "");
  }, [externalSearch]);

  useEffect(() => {
    const next = parseFilterState(initialFiltersSnapshot);
    setLocalFilters((prev) =>
      JSON.stringify(prev) === initialFiltersSnapshot ? prev : next,
    );
  }, [initialFiltersSnapshot]);

  const emitSearchChange = useMemo(
    () =>
      debounce((nextValue: string) => {
        onSearchChange?.(nextValue);
      }, debounceMs),
    [debounceMs, onSearchChange],
  );

  useEffect(() => () => emitSearchChange.cancel(), [emitSearchChange]);

  const updateSearch = (value: string) => {
    setLocalSearch(value);
    emitSearchChange(value);
  };

  const updateFilters = (nextFilters: FilterState) => {
    setLocalFilters(nextFilters);
    onFilterChange?.(nextFilters);
  };

  return {
    search: localSearch,
    filters: localFilters,
    updateSearch,
    updateFilters,
  };
};
