import { IBaseResponse } from "@/types/BaseResponse";
import { ReportCategory } from "./verification";

export interface ICategorySuggestion {
  category: ReportCategory;
  /** OSM features may have no name (specs/012). */
  nearest: { name: string | null; distance_m: number | null } | null;
}

export interface IGetReportContextRequest {
  lat: number;
  lng: number;
}

export type IGetReportContextResponse = IBaseResponse<{
  rules_version: string;
  /** When the OpenStreetMap copy was taken (specs/012). */
  osm_data_at?: string;
  /** "© OpenStreetMap contributors": shown wherever the suggestions' places are shown. */
  attribution?: string;
  suggestions: ICategorySuggestion[];
}>;
