import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";
import { SortBy, SortOrder } from "./incident";

export interface IGetReportsRequest {
  search?: string;
  status?: number;
  wasteType?: string;
  severityLevel?: number;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export type IGetReportsResponse = IBaseResponse<{
  reports: IIncident[];
}>;
