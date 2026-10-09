import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "@/libs/router";

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
  isDefaultCampaignStatuses,
  parseViewMode,
  serializeStatuses,
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

/** URL keys owned by the filter panel. */
const FILTER_URL_KEYS = ["search", "status", "statuses", "green_points_from", "green_points_to"];

export const CampaignSearchProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: CAMPAIGN_PAGE_SIZE,
  });

  /** Applies `updates` to the URL (empty values are removed) and goes back to page 1. */
  const replaceParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setPagination((prev) => (prev.current === 1 ? prev : { ...prev, current: 1 }));
    },
    [pathname, router, searchParams],
  );

  const viewMode = parseViewMode(useGetParam<string>("tab", "string", undefined));

  const setViewMode = useCallback(
    (mode: CampaignSearchViewMode) => replaceParams({ tab: mode === "mine" ? "mine" : undefined }),
    [replaceParams],
  );

  // The URL is the only source of the filters.
  const urlSearch = useGetParam<string>("search", "string", "");
  const urlStatuses = useGetParam<string>("statuses", "string", undefined);
  const urlStatus = useGetParam<string>("status", "string", undefined);
  const urlGreenPointsFrom = useGetParam<string>("green_points_from", "string", undefined);
  const urlGreenPointsTo = useGetParam<string>("green_points_to", "string", undefined);

  const filters = useMemo(
    () =>
      buildCampaignSearchFilters({
        search: urlSearch,
        statuses: urlStatuses,
        status: urlStatus,
        greenPointsFrom: urlGreenPointsFrom,
        greenPointsTo: urlGreenPointsTo,
      }),
    [urlGreenPointsFrom, urlGreenPointsTo, urlSearch, urlStatus, urlStatuses],
  );

  const setFilters = useCallback(
    (next: Partial<CampaignSearchFilters>) => {
      const updates: Record<string, string | undefined> = {};
      if ("search" in next) updates.search = next.search || undefined;
      if (next.statuses) {
        updates.statuses = isDefaultCampaignStatuses(next.statuses)
          ? undefined
          : serializeStatuses(next.statuses);
        updates.status = undefined;
      }
      if ("greenPointsFrom" in next) updates.green_points_from = next.greenPointsFrom?.toString();
      if ("greenPointsTo" in next) updates.green_points_to = next.greenPointsTo?.toString();
      replaceParams(updates);
    },
    [replaceParams],
  );

  const resetFilters = useCallback(
    () => replaceParams(Object.fromEntries(FILTER_URL_KEYS.map((key) => [key, undefined]))),
    [replaceParams],
  );

  const requestParams = useMemo<IGetCampaignsRequest>(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search?.trim() || undefined,
      statuses: serializeStatuses(filters.statuses),
    }),
    [filters.search, filters.statuses, pagination],
  );

  const exploreQuery = useGetCampaigns(requestParams, {
    enabled: viewMode === "explore",
    placeholderData: keepPreviousData,
  });
  const myQuery = useGetMyCampaigns(requestParams, {
    enabled: viewMode === "mine",
    placeholderData: keepPreviousData,
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

  const hasClientGreenPointsFilter = Boolean(
    filters.greenPointsFrom || filters.greenPointsTo,
  );
  const total = hasClientGreenPointsFilter
    ? campaigns.length
    : (queryResult.data?.data?.total ?? campaigns.length);

  const contextValue = useMemo(
    () => ({
      campaigns,
      isLoading: queryResult.isLoading,
      total,
      pagination,
      setPagination,
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
