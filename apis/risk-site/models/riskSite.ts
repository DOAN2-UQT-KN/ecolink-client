import type { IBaseResponse } from "@/types/BaseResponse";

export type RiskVerdict = "yes" | "no";

export interface IVoteRiskSiteRequest {
  lat: number;
  lng: number;
  address: string;
  verdict: RiskVerdict;
}

export type IVoteRiskSiteResponse = IBaseResponse<{
  site_key: string;
  verdict: RiskVerdict;
}>;

export interface IRiskSiteRow {
  site_key: string;
  address: string;
  latitude: number;
  longitude: number;
  yes_count: number;
  no_count: number;
  last_voted_at: string;
}

export interface IGetRiskSitesRequest {
  page: number;
  limit: number;
}

export type IGetRiskSitesResponse = IBaseResponse<{
  items: IRiskSiteRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;
