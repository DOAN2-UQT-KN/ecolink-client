"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ICampaign } from "@/apis/campaign/models/campaign";
import { useGetCampaigns, useGetMyCampaigns } from "@/apis/campaign/getCampaigns";
import useGetParam from "@/hooks/useGetParam";
import type { IGetCampaignsRequest } from "@/apis/campaign/models/getCampaigns";

import {
  applyGreenPointsRange,
  buildCampaignSearchFilters,
  CAMPAIGN_PAGE_SIZE,
  type CampaignSearchFilters,
  type CampaignSearchViewMode,
  parseViewMode,
} from "../_services/campaignSearch.service";

interface CampaignSearchContextType {
  campaigns: ICampaign[];
  isLoading: boolean;
  total: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  viewMode: CampaignSearchViewMode;
  setViewMode: (mode: CampaignSearchViewMode) => void;
  filters: CampaignSearchFilters;
  setFilters: (filters: Partial<CampaignSearchFilters>) => void;
  resetFilters: () => void;
  refetch: () => void;
}

export const CampaignSearchContext = createContext<CampaignSearchContextType | undefined>(
  undefined,
);

export const CampaignSearchProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: CAMPAIGN_PAGE_SIZE,
  });

  const urlTab = useGetParam<string>("tab", "string", undefined);
  const viewMode = useMemo(() => parseViewMode(urlTab), [urlTab]);

  const setViewMode = useCallback(
    (mode: CampaignSearchViewMode) => {
      const params = new URLSearchParams(searchParams.toString());

      if (mode === "mine") {
        params.set("tab", "mine");
      } else {
        params.delete("tab");
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [pathname, router, searchParams],
  );

  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatus = useGetParam<string>("status", "string", undefined);
  const urlGreenPointsFrom = useGetParam<string>("green_points_from", "string", undefined);
  const urlGreenPointsTo = useGetParam<string>("green_points_to", "string", undefined);

  const [filters, setFiltersState] = useState<CampaignSearchFilters>(() =>
    buildCampaignSearchFilters({
      search: urlSearch,
      status: urlStatus,
      greenPointsFrom: urlGreenPointsFrom,
      greenPointsTo: urlGreenPointsTo,
    }),
  );

  useEffect(() => {
    setFiltersState(
      buildCampaignSearchFilters({
        search: urlSearch,
        status: urlStatus,
        greenPointsFrom: urlGreenPointsFrom,
        greenPointsTo: urlGreenPointsTo,
      }),
    );
  }, [urlGreenPointsFrom, urlGreenPointsTo, urlSearch, urlStatus]);

  const setFilters = useCallback((newFilters: Partial<CampaignSearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      search: "",
      status: undefined,
      greenPointsFrom: undefined,
      greenPointsTo: undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSetPagination = useCallback((newPagination: { current: number; pageSize: number }) => {
    setPagination(newPagination);
  }, []);

  const requestParams = useMemo<IGetCampaignsRequest>(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search?.trim() || undefined,
      status: filters.status,
    }),
    [filters.search, filters.status, pagination.current, pagination.pageSize],
  );

  const exploreQuery = useGetCampaigns(requestParams, {
    enabled: viewMode === "explore",
  });
  const myQuery = useGetMyCampaigns(requestParams, {
    enabled: viewMode === "mine",
  });

  const queryResult = viewMode === "mine" ? myQuery : exploreQuery;
  const rawCampaigns = useMemo<ICampaign[]>(
    () => (queryResult.data?.data?.campaigns as ICampaign[] | undefined) ?? [],
    [queryResult.data],
  );

  const campaigns = useMemo(
    () => applyGreenPointsRange(rawCampaigns, filters.greenPointsFrom, filters.greenPointsTo),
    [filters.greenPointsFrom, filters.greenPointsTo, rawCampaigns],
  );

  const total = useMemo(() => campaigns.length, [campaigns]);

  const contextValue = useMemo(
    () => ({
      campaigns,
      isLoading: queryResult.isLoading,
      total,
      pagination,
      setPagination: handleSetPagination,
      viewMode,
      setViewMode,
      filters,
      setFilters,
      resetFilters,
      refetch: queryResult.refetch,
    }),
    [
      campaigns,
      filters,
      handleSetPagination,
      pagination,
      queryResult.isLoading,
      queryResult.refetch,
      resetFilters,
      setFilters,
      setViewMode,
      total,
      viewMode,
    ],
  );

  return <CampaignSearchContext.Provider value={contextValue}>{children}</CampaignSearchContext.Provider>;
};

export const useCampaignSearch = () => {
  const context = useContext(CampaignSearchContext);

  if (context === undefined) {
    throw new Error("useCampaignSearch must be used within a CampaignSearchProvider");
  }

  return context;
};
