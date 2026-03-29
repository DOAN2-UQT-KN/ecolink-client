import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";

export interface IUpdateReportRequest {
  title: string;
  description: string;
  wasteType: string;
  severityLevel: number;
  latitude: number;
  longitude: number;
}

export type IUpdateReportResponse = IBaseResponse<{
  report: IIncident;
}>;
