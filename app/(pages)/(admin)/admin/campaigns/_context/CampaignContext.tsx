'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useGetCampaigns } from '@/apis/campaign/getCampaigns';
import type { IGetCampaignsRequest } from '@/apis/campaign/models/getCampaigns';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import useGetParam from '@/hooks/useGetParam';

export type FormFilterValues = {
  status: string;
  organizationId: string;
  sortBy: 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type CampaignContextType = {
  filters: FormFilterValues;
  pagination: PaginationState;
  campaigns: ICampaign[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<FormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

function parseSortBy(value: string | undefined): FormFilterValues['sortBy'] {
  if (value === 'updated_at') return value;
  return 'created_at';
}

function parseSortOrder(value: string | undefined): FormFilterValues['sortOrder'] {
  if (value === 'asc' || value === 'desc') return value;
  return 'desc';
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const urlStatus = useGetParam<string>('status', 'string', 'all');
  const urlOrganizationId = useGetParam<string>('organization_id', 'string', '');
  const urlSortBy = useGetParam<string>('sort_by', 'string', 'created_at');
  const urlSortOrder = useGetParam<string>('sort_order', 'string', 'desc');
  const urlPage = useGetParam<number>('page', 'number', 1);
  const urlLimit = useGetParam<number>('limit', 'number', 10);

  const [filters, setFilters] = useState<FormFilterValues>({
    status: urlStatus ?? 'all',
    organizationId: urlOrganizationId ?? '',
    sortBy: parseSortBy(urlSortBy),
    sortOrder: parseSortOrder(urlSortOrder),
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    const nextFilters: FormFilterValues = {
      status: urlStatus ?? 'all',
      organizationId: urlOrganizationId ?? '',
      sortBy: parseSortBy(urlSortBy),
      sortOrder: parseSortOrder(urlSortOrder),
    };
    setFilters((prev) => {
      if (
        prev.status === nextFilters.status &&
        prev.organizationId === nextFilters.organizationId &&
        prev.sortBy === nextFilters.sortBy &&
        prev.sortOrder === nextFilters.sortOrder
      ) {
        return prev;
      }
      return nextFilters;
    });

    const nextPagination: PaginationState = {
      current: Math.max(1, urlPage ?? 1),
      pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
    };
    setPagination((prev) => {
      if (prev.current === nextPagination.current && prev.pageSize === nextPagination.pageSize) {
        return prev;
      }
      return nextPagination;
    });
  }, [urlLimit, urlOrganizationId, urlPage, urlSortBy, urlSortOrder, urlStatus]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const request: IGetCampaignsRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      status: filters.status === 'all' ? undefined : Number(filters.status),
      organization_id: filters.organizationId || undefined,
    }),
    [filters.organizationId, filters.status, pagination],
  );

  const { data, isLoading } = useGetCampaigns(request);

  const campaigns = useMemo(() => data?.data?.campaigns ?? [], [data?.data?.campaigns]);
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<FormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          status: merged.status === 'all' ? undefined : merged.status,
          organization_id: merged.organizationId || undefined,
          sort_by: merged.sortBy,
          sort_order: merged.sortOrder,
          page: '1',
        });
        return merged;
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    const resetFilters: FormFilterValues = {
      status: 'all',
      organizationId: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({
      status: undefined,
      organization_id: undefined,
      sort_by: undefined,
      sort_order: undefined,
      page: undefined,
    });
  }, [setParams]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      setPagination((prev) => ({ ...prev, current: nextPage }));
      setParams({ page: String(nextPage), limit: String(pagination.pageSize) });
    },
    [pagination.pageSize, setParams],
  );

  const onPageSizeChange = useCallback(
    (nextSize: number) => {
      const pageSize = Math.max(1, Math.floor(nextSize));
      setPagination((prev) => ({ ...prev, pageSize, current: 1 }));
      setParams({ limit: String(pageSize), page: '1' });
    },
    [setParams],
  );

  const value = useMemo(
    () => ({
      filters,
      pagination,
      campaigns,
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
      campaigns,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaignContext must be used within CampaignProvider');
  }
  return context;
}
