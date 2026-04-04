import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";

export interface IUpdateReportRequest {
  title: string;
  description: string;
  waste_type: string;
  severity_level: number;
  latitude: number;
  longitude: number;
}

export type IUpdateReportResponse = IBaseResponse<{
  report: IIncident;
}>;
