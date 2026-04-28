'use client';

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { IGift } from '@/apis/gift/models/gift';
import { useGetGifts } from '@/apis/gift/getGifts';
import { useRedeemGift } from '@/apis/gift/redeemGift';
import useGetParam from '@/hooks/useGetParam';

import {
  buildGiftFilters,
  buildGiftRequest,
  type GiftFilters,
  GIFT_PAGE_SIZE,
  normalizePointsRange,
} from '../_services/gift.service';

type PaginationState = {
  current: number;
  pageSize: number;
};

type GiftContextType = {
  gifts: IGift[];
  isLoading: boolean;
  isRedeeming: boolean;
  total: number;
  totalPages: number;
  pagination: PaginationState;
  setPagination: (value: PaginationState) => void;
  filters: GiftFilters;
  setFilters: (filters: Partial<GiftFilters>) => void;
  resetFilters: () => void;
  onRedeem: (gift: IGift) => void;
  onViewMore: (gift: IGift) => void;
};

const GiftContext = createContext<GiftContextType | undefined>(undefined);

export const GiftProvider = React.memo(function GiftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = useGetParam<string>('search', 'string', '');
  const urlStock = useGetParam<string>('in_stock', 'string', undefined);
  const urlSortBy = useGetParam<string>('sort_by', 'string', undefined);
  const urlPointsMin = useGetParam<string>('points_min', 'string', undefined);
  const urlPointsMax = useGetParam<string>('points_max', 'string', undefined);
  const urlPage = useGetParam<number>('page', 'number', 1);

  const [pagination, setPaginationState] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: GIFT_PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<GiftFilters>(() =>
    buildGiftFilters({
      search: urlSearch,
      inStock: urlStock,
      sortBy: urlSortBy,
      pointsMin: urlPointsMin,
      pointsMax: urlPointsMax,
    }),
  );

  useEffect(() => {
    setFiltersState(
      buildGiftFilters({
        search: urlSearch,
        inStock: urlStock,
        sortBy: urlSortBy,
        pointsMin: urlPointsMin,
        pointsMax: urlPointsMax,
      }),
    );
  }, [urlPointsMax, urlPointsMin, urlSearch, urlSortBy, urlStock]);

  useEffect(() => {
    setPaginationState((prev) => {
      const nextPage = Math.max(1, urlPage ?? 1);
      if (prev.current === nextPage) return prev;
      return { ...prev, current: nextPage };
    });
  }, [urlPage]);

  const request = useMemo(() => buildGiftRequest(filters, pagination), [filters, pagination]);
  const { data, isLoading } = useGetGifts({ ...request, isActive: true });
  const { mutateAsync: redeemGiftMutateAsync, isPending: isRedeeming } = useRedeemGift();

  const rawGifts = useMemo(() => data?.data?.gifts ?? [], [data]);

  const gifts = useMemo(() => {
    const sorted = [...rawGifts];
    switch (filters.sortBy) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'points_desc':
        sorted.sort((a, b) => b.greenPoints - a.greenPoints);
        break;
      case 'points_asc':
      default:
        sorted.sort((a, b) => a.greenPoints - b.greenPoints);
        break;
    }
    return sorted;
  }, [filters.sortBy, rawGifts]);

  const total = useMemo(() => data?.data?.meta?.total ?? 0, [data]);
  const totalPages = useMemo(
    () => Math.max(1, data?.data?.meta?.totalPages ?? Math.ceil(total / pagination.pageSize || 1)),
    [data, pagination.pageSize, total],
  );

  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPagination = useCallback(
    (value: PaginationState) => {
      setPaginationState(value);
      updateURL({
        page: String(value.current),
      });
    },
    [updateURL],
  );

  const setFilters = useCallback(
    (nextFilters: Partial<GiftFilters>) => {
      setFiltersState((prev) => {
        const merged = {
          ...prev,
          ...nextFilters,
          pointsRange: normalizePointsRange(
            nextFilters.pointsRange?.[0] ?? prev.pointsRange[0],
            nextFilters.pointsRange?.[1] ?? prev.pointsRange[1],
          ),
        };
        updateURL({
          search: merged.search.trim() || undefined,
          in_stock: merged.inStock === 'in_stock' ? 'in_stock' : undefined,
          sort_by: merged.sortBy,
          points_min: String(merged.pointsRange[0]),
          points_max: String(merged.pointsRange[1]),
          page: '1',
        });
        return merged;
      });
      setPaginationState((prev) => ({ ...prev, current: 1 }));
    },
    [updateURL],
  );

  const resetFilters = useCallback(() => {
    const resetValues = buildGiftFilters({});
    setFiltersState(resetValues);
    setPaginationState((prev) => ({ ...prev, current: 1 }));
    updateURL({
      search: undefined,
      in_stock: undefined,
      sort_by: undefined,
      points_min: undefined,
      points_max: undefined,
      page: undefined,
    });
  }, [updateURL]);

  const onRedeem = useCallback(
    (gift: IGift) => {
      if (isRedeeming) return;
      void redeemGiftMutateAsync({ id: gift.id });
    },
    [isRedeeming, redeemGiftMutateAsync],
  );

  const onViewMore = useCallback(
    (gift: IGift) => {
      router.push(`/gifts/${gift.id}`);
    },
    [router],
  );

  const value = useMemo(
    () => ({
      gifts,
      isLoading,
      isRedeeming,
      total,
      totalPages,
      pagination,
      setPagination,
      filters,
      setFilters,
      resetFilters,
      onRedeem,
      onViewMore,
    }),
    [
      filters,
      gifts,
      isLoading,
      isRedeeming,
      onRedeem,
      onViewMore,
      pagination,
      resetFilters,
      setFilters,
      setPagination,
      total,
      totalPages,
    ],
  );

  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
});

export const useGift = () => {
  const ctx = useContext(GiftContext);
  if (!ctx) {
    throw new Error('useGift must be used within GiftProvider');
  }
  return ctx;
};
