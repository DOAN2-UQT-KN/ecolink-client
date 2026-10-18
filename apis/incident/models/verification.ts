import { IBaseResponse } from "@/types/BaseResponse";

/** Server enum `ReportCategory` (incident-service prisma schema). */
export type ReportCategory =
  | "WATERWAY"
  | "BEACH"
  | "MARKET"
  | "SCHOOL"
  | "PARK"
  | "INDUSTRIAL_ZONE"
  | "ALLEY"
  | "STREET"
  | "ILLEGAL_DUMP"
  | "DRAIN"
  | "OPEN_BURNING"
  | "OTHER";

export type WasteType = "HOUSEHOLD" | "CONSTRUCTION" | "INDUSTRIAL" | "HAZARDOUS";

export type VerificationStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type VerificationFlag = "ACCEPT" | "REVIEW" | "REJECT";
/** A timeout is stored as FAILED with an `error`. */
export type CheckStatus = "COMPLETED" | "SKIPPED" | "FAILED" | "NOT_AVAILABLE";
export type ModerationReasonCode = "DUPLICATE_OF_OTHER" | "NOT_ON_SITE" | "INAPPROPRIATE_CONTENT";
/** Wire keys of `checks`: the server snake-cases `DUPLICATE` to `duplicate`. */
export type CheckName = "duplicate" | "trust" | "context";

export interface IVerificationIssue {
  code: string;
  primary: boolean;
  evidence: {
    similar_report_id?: string | null;
    distance_m?: number | null;
    time_delta_hours?: number | null;
    nearest?: { name: string | null; distance_m: number | null } | null;
    /** CTX_CATEGORY_LOCATION_MISMATCH: categories that fit the location, nearest first (specs/012). */
    suggested_categories?: { category: string; nearest: { name: string | null; distance_m: number | null } | null }[];
    /** DUP_WEB_IMAGE_MATCH: the web image and the page it was found on (https only). */
    image_index?: number | null;
    source_url?: string | null;
    page_url?: string | null;
    page_title?: string | null;
  };
}

/** What the report owner sees: public reasons only, no score. */
export interface IUserVerification {
  report_id: string;
  report_status: number | null;
  attempt: number;
  status: VerificationStatus;
  flag: VerificationFlag | null;
  issues: IVerificationIssue[];
  completed_at: string | null;
}

export interface ISignal {
  name: string;
  status: CheckStatus;
  risk: number | null;
  raw?: number | null;
}

export interface ICheckResult {
  status: CheckStatus;
  risk: number | null;
  reasons: string[];
  signals: ISignal[];
  evidence: Record<string, unknown>;
  duration_ms: number | null;
  version: string;
  error: { code: string; message: string } | null;
}

export interface IAdminVerification {
  report_id: string;
  report_status: number | null;
  verification_id: string;
  attempt: number;
  status: VerificationStatus;
  risk_score: number | null;
  flag: VerificationFlag | null;
  reasons: string[];
  checks: Partial<Record<CheckName, ICheckResult>>;
  versions: { pipeline: string; engine: string | null };
  moderation: {
    decision: "ACCEPT" | "REJECT" | null;
    reason_code: ModerationReasonCode | null;
    by: string | null;
    at: string;
  } | null;
  started_at: string | null;
  completed_at: string | null;
}

export type IGetReportVerificationResponse<T = IUserVerification | IAdminVerification> =
  IBaseResponse<{ verification: T }>;

export type IGetReportVerificationsResponse = IBaseResponse<{
  verifications: IAdminVerification[];
}>;

export function isAdminVerification(
  v: IUserVerification | IAdminVerification,
): v is IAdminVerification {
  return "checks" in v;
}
