import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";
import { ReportCategory, WasteType } from "./verification";

export interface ICreateReportImage {
  url: string;
  /** Only for photos uploaded under a capture session (POST /reports/captures). */
  capture_id?: string;
}

export interface ICreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  waste_types: WasteType[];
  condition?: string;
  severity_level?: number;
  latitude?: number;
  longitude?: number;
  detail_address?: string;
  images: ICreateReportImage[];
}

export type ICreateReportResponse = IBaseResponse<{
  report: IIncident;
}>;
