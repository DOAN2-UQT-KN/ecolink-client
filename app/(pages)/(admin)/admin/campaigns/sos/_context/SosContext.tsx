import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from '@/libs/router';

import { useSosList } from '@/apis/sos/getSos';
import type { ISosListRequest, ISosSummary, SosType } from '@/apis/sos/models/sos';
import { SOS_OPEN_STATES_PARAM, SOS_TYPES } from '@/constants/sos';
import useGetParam from '@/hooks/useGetParam';

/** `open` = the live states (open, helping, escalated), the default view. */
export const SOS_STATE_FILTERS = ['open', 'escalated', 'resolved', 'expired', 'all'] as const;
export type SosStateFilter = (typeof SOS_STATE_FILTERS)[number];
export type SosTypeFilter = SosType | 'all';

export type FormFilterValues = {
  search: string;
  type: SosTypeFilter;
  state: SosStateFilter;
};

type PaginationState = {
  current: number;
  pageSize: number;
};

type SosContextType = {
  filters: FormFilterValues;
  pagination: PaginationState;
  sosList: ISosSummary[];
  total: number;
  loading: boolean;
  onFilterChange: (next: Partial<FormFilterValues>) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const SosContext = createContext<SosContextType | undefined>(undefined);

function parseType(value: string | undefined): SosTypeFilter {
  return SOS_TYPES.includes(value as SosType) ? (value as SosType) : 'all';
}

function parseState(value: string | undefined): SosStateFilter {
  return SOS_STATE_FILTERS.includes(value as SosStateFilter) ? (value as SosStateFilter) : 'open';
}

function toStatesParam(state: SosStateFilter): string {
  return state === 'open' ? SOS_OPEN_STATES_PARAM : state;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number]) ? limit : 10;
}

export function SosProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const urlSearch = useGetParam<string>('search', 'string', '');
  const urlType = useGetParam<string>('type', 'string', 'all');
  const urlState = useGetParam<string>('state', 'string', 'open');
  const urlPage = useGetParam<number>('page', 'number', 1);
  const urlLimit = useGetParam<number>('limit', 'number', 10);

  const [filters, setFilters] = useState<FormFilterValues>({
    search: urlSearch ?? '',
    type: parseType(urlType),
    state: parseState(urlState),
  });

  const [pagination, setPagination] = useState<PaginationState>({
    current: Math.max(1, urlPage ?? 1),
    pageSize: normalizePageSize(Math.max(1, urlLimit ?? 10)),
  });

  useEffect(() => {
    const nextFilters: FormFilterValues = {
      search: urlSearch ?? '',
      type: parseType(urlType),
      state: parseState(urlState),
    };
    setFilters((prev) => {
      if (
        prev.search === nextFilters.search &&
        prev.type === nextFilters.type &&
        prev.state === nextFilters.state
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
  }, [urlLimit, urlPage, urlSearch, urlState, urlType]);

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

  const request: ISosListRequest = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search.trim().replace(/^#/, '') || undefined,
      type: filters.type === 'all' ? undefined : filters.type,
      states: toStatesParam(filters.state),
    }),
    [filters.search, filters.state, filters.type, pagination],
  );

  const { data, isLoading } = useSosList(request);

  const sosList = useMemo(() => data?.data?.items ?? [], [data?.data?.items]);
  const total = data?.data?.total ?? 0;

  const onFilterChange = useCallback(
    (next: Partial<FormFilterValues>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...next };
        setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
        setParams({
          search: merged.search.trim() || undefined,
          type: merged.type === 'all' ? undefined : merged.type,
          // `open` is the default view, so it stays out of the URL.
          state: merged.state === 'open' ? undefined : merged.state,
          page: '1',
        });
        return merged;
      });
    },
    [setParams],
  );

  const onResetFilters = useCallback(() => {
    setFilters({ search: '', type: 'all', state: 'open' });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setParams({ search: undefined, type: undefined, state: undefined, page: undefined });
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
      sosList,
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
      sosList,
      total,
      isLoading,
      onFilterChange,
      onResetFilters,
      onPageChange,
      onPageSizeChange,
    ],
  );

  return <SosContext.Provider value={value}>{children}</SosContext.Provider>;
}

export function useSosContext() {
  const context = useContext(SosContext);
  if (!context) {
    throw new Error('useSosContext must be used within SosProvider');
  }
  return context;
}
