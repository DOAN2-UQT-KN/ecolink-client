import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";
import { ModerationReasonCode } from "./verification";

export type ModerationFlag = "REVIEW" | "REJECT";

export interface IModerationQueueItem {
  id: string;
  title: string | null;
  created_at: string;
  detail_address: string | null;
  risk_score: number | null;
  reasons: string[];
  thumbnail_url: string | null;
}

export interface IGetModerationQueueRequest {
  flag?: ModerationFlag;
  page?: number;
  limit?: number;
}

export type IGetModerationQueueResponse = IBaseResponse<{
  reports: IModerationQueueItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  counts: { review: number; auto_rejected: number };
}>;

export interface IModerateReportRequest {
  id: string;
  data: {
    decision: "ACCEPT" | "REJECT";
    reason_code?: ModerationReasonCode;
    note?: string;
  };
}

export type IModerateReportResponse = IBaseResponse<{ report: IIncident }>;
