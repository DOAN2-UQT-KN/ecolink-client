"use client";

import { useMemo } from "react";
import type { RowKey } from "../types";

type UseSelectionParams<T> = {
  rows: T[];
  selectedRowKeys: RowKey[];
  getRowKey: (row: T, index: number) => RowKey;
  canSelectRecord: (record: T) => boolean;
};

export const useSelection = <T,>({
  rows,
  selectedRowKeys,
  getRowKey,
  canSelectRecord,
}: UseSelectionParams<T>) => {
  const selectableKeys = useMemo(
    () =>
      rows
        .filter((item) => canSelectRecord(item))
        .map((item, index) => getRowKey(item, index)),
    [canSelectRecord, getRowKey, rows],
  );

  const selectedKeySet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);

  const selectableSelectedCount = useMemo(
    () => selectableKeys.filter((key) => selectedKeySet.has(key)).length,
    [selectableKeys, selectedKeySet],
  );

  const allSelected = selectableKeys.length > 0 && selectableSelectedCount === selectableKeys.length;
  const partiallySelected = selectableSelectedCount > 0 && !allSelected;

  return {
    selectableKeys,
    allSelected,
    partiallySelected,
  };
};
