'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

function isPointsFilterTab(value: string | null): value is PointsFilterTab {
  return value === 'all' || value === 'earned' || value === 'spent';
}

export function PointsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlType = searchParams.get('type');
  const initialTab: PointsFilterTab =
    isPointsFilterTab(urlType) && urlType !== 'all' ? urlType : 'all';

  const [tab, setTab] = useState<PointsFilterTab>(initialTab);
  const [pagination, setPaginationState] = useState({
    current: 1,
    pageSize: POINTS_DEFAULT_PAGE_SIZE,
  });

  useEffect(() => {
    const nextTab: PointsFilterTab =
      isPointsFilterTab(urlType) && urlType !== 'all' ? urlType : 'all';
    setTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [urlType]);

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

  const updateTabInURL = useCallback(
    (nextTab: PointsFilterTab) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === 'all') {
        params.delete('type');
      } else {
        params.set('type', nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleSetTab = useCallback((nextTab: PointsFilterTab) => {
    setTab(nextTab);
    setPaginationState((prev) => ({ ...prev, current: 1 }));
    updateTabInURL(nextTab);
  }, [updateTabInURL]);

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
