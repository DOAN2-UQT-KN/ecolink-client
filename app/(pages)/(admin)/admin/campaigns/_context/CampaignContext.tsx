import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from '@/libs/router';

import { useGetCampaigns } from '@/apis/campaign/getCampaigns';
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import type { IGetCampaignsRequest } from '@/apis/campaign/models/getCampaigns';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import useGetParam from '@/hooks/useGetParam';

export type FormFilterValues = {
  search: string;
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

const EMPTY_CAMPAIGNS: ICampaign[] = [];

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the only source of the filters and the page.
  const urlSearch = useGetParam<string>('search', 'string', '');
  const urlStatus = useGetParam<string>('status', 'string', 'all');
  const urlOrganizationId = useGetParam<string>('organization_id', 'string', '');
  const urlSortBy = useGetParam<string>('sort_by', 'string', 'created_at');
  const urlSortOrder = useGetParam<string>('sort_order', 'string', 'desc');
  const urlPage = useGetParam<number>('page', 'number', 1);
  const urlLimit = useGetParam<number>('limit', 'number', 10);

  const filters = useMemo<FormFilterValues>(
    () => ({
      search: urlSearch ?? '',
      status: urlStatus ?? 'all',
      organizationId: urlOrganizationId ?? '',
      sortBy: parseSortBy(urlSortBy),
      sortOrder: parseSortOrder(urlSortOrder),
    }),
    [urlOrganizationId, urlSearch, urlSortBy, urlSortOrder, urlStatus],
  );

  const current = Math.max(1, urlPage ?? 1);
  const pageSize = normalizePageSize(Math.max(1, urlLimit ?? 10));
  const pagination = useMemo<PaginationState>(() => ({ current, pageSize }), [current, pageSize]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
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
    [pathname, router, searchParams],
  );

  // TanStack Query hashes the key, so this object needs no memo.
  const request: IGetCampaignsRequest = {
    page: pagination.current,
    limit: pagination.pageSize,
    search: filters.search.trim() || undefined,
    status: filters.status === 'all' ? undefined : Number(filters.status),
    organizationId: filters.organizationId || undefined,
    // The review queue leaves out organizations the admin belongs to.
    excludeMemberOrgs:
      Number(filters.status) === CAMPAIGN_STATUS.PENDING_REVIEW ? true : undefined,
  };

  const { data, isLoading } = useGetCampaigns(request);

  const campaigns = data?.data?.campaigns ?? EMPTY_CAMPAIGNS;
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<FormFilterValues>) => {
      const merged = { ...filters, ...next };
      setParams({
        search: merged.search.trim() || undefined,
        status: merged.status === 'all' ? undefined : merged.status,
        organization_id: merged.organizationId || undefined,
        sort_by: merged.sortBy,
        sort_order: merged.sortOrder,
        page: '1',
      });
    },
    [filters, setParams],
  );

  const onResetFilters = useCallback(() => {
    setParams({
      search: undefined,
      status: undefined,
      organization_id: undefined,
      sort_by: undefined,
      sort_order: undefined,
      page: undefined,
    });
  }, [setParams]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      setParams({ page: String(nextPage), limit: String(pagination.pageSize) });
    },
    [pagination.pageSize, setParams],
  );

  const onPageSizeChange = useCallback(
    (nextSize: number) => {
      setParams({ limit: String(Math.max(1, Math.floor(nextSize))), page: '1' });
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
