import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";

export interface ICreateReportRequest {
  title: string;
  description: string;
  waste_type?: string;
  severity_level?: number;
  latitude?: number;
  longitude?: number;
  detail_address?: string;
  image_urls?: string[];
}

export type ICreateReportResponse = IBaseResponse<{
  report: IIncident;
}>;
