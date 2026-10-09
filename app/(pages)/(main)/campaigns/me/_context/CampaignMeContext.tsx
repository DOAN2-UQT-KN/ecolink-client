import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';

import { useGetMyCampaigns } from '@/apis/campaign/getCampaigns';
import { ICampaign } from '@/apis/campaign/models/campaign';
import { IGetCampaignsRequest } from '@/apis/campaign/models/getCampaigns';
import { ALL_ORGANIZATIONS_VALUE } from '@/components/form/SelectListOrganization';
import useGetParam from '@/hooks/useGetParam';
import { usePathname, useRouter, useSearchParams } from '@/libs/router';
import useOrgContextStore from '@/stores/useOrgContextStore';

type CampaignMeFilters = Pick<IGetCampaignsRequest, 'search' | 'status' | 'organizationId'>;

export interface CampaignMeContextType {
  campaigns: ICampaign[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  filters: CampaignMeFilters;
  /** Writes the given filters to the URL (empty values are removed) and goes back to page 1. */
  setFilters: (filters: Partial<CampaignMeFilters>) => void;
  refetch: () => void;
}

export const CampaignMeContext = createContext<CampaignMeContextType | undefined>(undefined);

export const CampaignMeProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeOrganizationId = useOrgContextStore((s) => s.activeOrganizationId);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // The URL is the only source of the filters (useGetParam trims and drops empty values).
  const urlSearch = useGetParam<string>('search', 'string');
  const urlStatus = useGetParam<number>('status', 'number');
  const urlOrganizationId = useGetParam<string>('organizationId', 'string');

  /**
   * No `organizationId` in the URL → default to the active organization context.
   * `organizationId=-1` means the user explicitly picked "All organizations", so the default
   * must not re-apply.
   */
  const organizationId = !urlOrganizationId
    ? (activeOrganizationId ?? undefined)
    : urlOrganizationId === ALL_ORGANIZATIONS_VALUE
      ? undefined
      : urlOrganizationId;

  const filters = useMemo<CampaignMeFilters>(
    () => ({ search: urlSearch, status: urlStatus, organizationId }),
    [organizationId, urlSearch, urlStatus],
  );

  const setFilters = useCallback(
    (next: Partial<CampaignMeFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value == null || value === '') params.delete(key);
        else params.set(key, String(value));
      }
      setPagination((prev) => ({ ...prev, current: 1 }));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, refetch } = useGetMyCampaigns(
    {
      page: pagination.current,
      limit: pagination.pageSize,
      is_owner: true,
      ...filters,
    },
    { placeholderData: keepPreviousData },
  );

  const campaigns = useMemo(() => data?.data?.campaigns ?? [], [data]);
  const total = typeof data?.data?.total === 'number' ? data.data.total : campaigns.length;

  const contextValue = useMemo(
    () => ({
      campaigns,
      isLoading,
      total,
      pagination,
      setPagination,
      filters,
      setFilters,
      refetch,
    }),
    [campaigns, filters, isLoading, pagination, refetch, setFilters, total],
  );

  return <CampaignMeContext.Provider value={contextValue}>{children}</CampaignMeContext.Provider>;
};

export function useCampaignMeContext() {
  const context = useContext(CampaignMeContext);
  if (!context) {
    throw new Error('useCampaignMeContext must be used within CampaignMeProvider');
  }
  return context;
}
