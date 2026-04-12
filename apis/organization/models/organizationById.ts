import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IUpdateOrganizationRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
}

export type IGetOrganizationByIdResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IUpdateOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IVerifyOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;

export type IResendContactEmailResponse = IBaseResponse<{
  organization: IOrganization;
}>;
