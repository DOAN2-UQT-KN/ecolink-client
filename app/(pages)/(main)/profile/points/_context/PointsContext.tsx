'use client';

import { createContext, type ReactNode, useCallback, useMemo, useState } from 'react';

import { useGetPointTransactions, useGetPoints } from '@/apis/points/getPoints';
import type { IPoint, IPointTransaction } from '@/apis/points/models/point';

import {
  POINTS_DEFAULT_PAGE_SIZE,
  type PointsFilterTab,
  buildTransactionRequestByTab,
  normalizeTransactions,
} from '../_services/points.service';

export interface PointsContextType {
  points: IPoint | null;
  transactions: IPointTransaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  tab: PointsFilterTab;
  setTab: (tab: PointsFilterTab) => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  refetch: () => void;
}

export const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<PointsFilterTab>('all');
  const [pagination, setPaginationState] = useState({
    current: 1,
    pageSize: POINTS_DEFAULT_PAGE_SIZE,
  });

  const pointsQuery = useGetPoints({});
  const transactionsQuery = useGetPointTransactions({
    page: pagination.current,
    limit: pagination.pageSize,
    ...buildTransactionRequestByTab(tab),
  });

  const transactions = useMemo(
    () => normalizeTransactions(transactionsQuery.data?.data?.transactions),
    [transactionsQuery.data?.data?.transactions],
  );

  const total = useMemo(() => {
    const totalValue = transactionsQuery.data?.data?.total;
    return typeof totalValue === 'number' ? totalValue : transactions.length;
  }, [transactions.length, transactionsQuery.data?.data?.total]);

  const setPagination = useCallback((next: { current: number; pageSize: number }) => {
    setPaginationState(next);
  }, []);

  const handleSetTab = useCallback((nextTab: PointsFilterTab) => {
    setTab(nextTab);
    setPaginationState((prev) => ({ ...prev, current: 1 }));
  }, []);

  const refetch = useCallback(() => {
    pointsQuery.refetch();
    transactionsQuery.refetch();
  }, [pointsQuery, transactionsQuery]);

  const contextValue = useMemo<PointsContextType>(
    () => ({
      points: pointsQuery.data?.data ?? null,
      transactions,
      isLoading: pointsQuery.isLoading || transactionsQuery.isLoading,
      isRefreshing: pointsQuery.isFetching || transactionsQuery.isFetching,
      tab,
      setTab: handleSetTab,
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total,
      },
      setPagination,
      refetch,
    }),
    [
      handleSetTab,
      pagination.current,
      pagination.pageSize,
      pointsQuery.data?.data,
      pointsQuery.isFetching,
      pointsQuery.isLoading,
      refetch,
      setPagination,
      tab,
      total,
      transactions,
      transactionsQuery.isFetching,
      transactionsQuery.isLoading,
    ],
  );

  return <PointsContext.Provider value={contextValue}>{children}</PointsContext.Provider>;
}
