import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";

export interface ICreateReportRequest {
  title: string;
  description: string;
  wasteType?: string;
  severityLevel?: number;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
}

export type ICreateReportResponse = IBaseResponse<{
  report: IIncident;
}>;
