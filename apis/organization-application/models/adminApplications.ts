import { IBaseResponse } from "@/types/BaseResponse";
import {
  ApplicationLane,
  ApplicationStatus,
  IAdminApplication,
  OrgType,
} from "./application";

export interface IGetAdminApplicationsRequest {
  status?: ApplicationStatus | ApplicationStatus[];
  org_type?: OrgType | OrgType[];
  lane?: ApplicationLane | ApplicationLane[];
  q?: string;
  page?: number;
  limit?: number;
}

export type IGetAdminApplicationsResponse = IBaseResponse<{
  applications: IAdminApplication[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;

export interface IRequestMoreInfoRequest {
  id: string;
  message: string;
}

export interface IApplicationDecisionRequest {
  id: string;
  decision: "APPROVE" | "REJECT";
  lane?: ApplicationLane;
  documents_waived?: boolean;
  documents_waived_reason?: string | null;
  reject_reason?: string | null;
  grant_blue_tick?: boolean;
}
