import { IBaseResponse } from "@/types/BaseResponse";
import { ReportCategory } from "./verification";

export interface ICategorySuggestion {
  category: ReportCategory;
  nearest: { name: string; distance_m: number | null } | null;
}

export interface IGetReportContextRequest {
  lat: number;
  lng: number;
}

export type IGetReportContextResponse = IBaseResponse<{
  cell_id: string;
  rules_version: string;
  suggestions: ICategorySuggestion[];
}>;
