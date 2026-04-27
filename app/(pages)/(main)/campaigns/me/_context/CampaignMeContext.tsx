'use client';

import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { useGetMyCampaigns } from '@/apis/campaign/getCampaigns';
import { ICampaign } from '@/apis/campaign/models/campaign';
import { IGetCampaignsRequest } from '@/apis/campaign/models/getCampaigns';
import { ALL_ORGANIZATIONS_VALUE } from '@/components/form/SelectListOrganization';
import useGetParam from '@/hooks/useGetParam';

export interface CampaignMeContextType {
  campaigns: ICampaign[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  filters: Partial<IGetCampaignsRequest>;
  setFilters: (filters: Partial<IGetCampaignsRequest>) => void;
  refetch: () => void;
}

export const CampaignMeContext = createContext<CampaignMeContextType | undefined>(undefined);

export const CampaignMeProvider = ({ children }: { children: ReactNode }) => {
  const normalizeOrganizationId = useCallback((value?: string) => {
    if (!value || value === ALL_ORGANIZATIONS_VALUE) return undefined;
    return value;
  }, []);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const urlSearch = useGetParam<string>('search', 'string', '');
  const urlStatus = useGetParam<number>('status', 'number', undefined);
  const urlOrganizationId = useGetParam<string>('organizationId', 'string', '');

  const [filters, setFiltersState] = useState<Partial<IGetCampaignsRequest>>({
    search: urlSearch,
    status: urlStatus,
    organizationId: normalizeOrganizationId(urlOrganizationId),
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL -> filter sync
    setFiltersState({
      search: urlSearch,
      status: urlStatus,
      organizationId: normalizeOrganizationId(urlOrganizationId),
    });
  }, [normalizeOrganizationId, urlOrganizationId, urlSearch, urlStatus]);

  const setFilters = useCallback((newFilters: Partial<IGetCampaignsRequest>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSetPagination = useCallback(
    (newPagination: { current: number; pageSize: number }) => {
      setPagination(newPagination);
    },
    [],
  );

  const { data, isLoading, refetch } = useGetMyCampaigns({
    page: pagination.current,
    limit: pagination.pageSize,
    is_owner: true,
    ...filters,
  });

  const campaigns = useMemo(() => data?.data?.campaigns ?? [], [data]);
  const total = useMemo(() => {
    const t = data?.data?.total;
    return typeof t === 'number' ? t : campaigns.length;
  }, [campaigns.length, data]);

  const contextValue = useMemo(
    () => ({
      campaigns,
      isLoading,
      total,
      pagination,
      setPagination: handleSetPagination,
      filters,
      setFilters,
      refetch,
    }),
    [campaigns, filters, handleSetPagination, isLoading, pagination, refetch, setFilters, total],
  );

  return <CampaignMeContext.Provider value={contextValue}>{children}</CampaignMeContext.Provider>;
};
