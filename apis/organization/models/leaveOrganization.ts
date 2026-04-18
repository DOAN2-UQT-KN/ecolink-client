import { IBaseResponse } from "@/types/BaseResponse";

export interface ILeaveOrganizationRequest {
  id: string;
}

export type ILeaveOrganizationResponse = IBaseResponse<unknown>;
