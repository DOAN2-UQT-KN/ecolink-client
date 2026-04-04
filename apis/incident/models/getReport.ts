import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";
import { SortBy, SortOrder } from "./incident";

export interface IGetReportsRequest {
  search?: string;
  status?: number;
  waste_type?: string;
  severity_level?: number;
  latitude?: number;
  longitude?: number;
  max_distance?: number;
  sort_by?: SortBy;
  sort_order?: SortOrder;
  page?: number;
  limit?: number;
}

export type IGetReportsResponse = IBaseResponse<{
  reports: IIncident[];
}>;
