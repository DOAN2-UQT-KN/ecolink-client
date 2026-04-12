import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface IUpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  background_url?: string;
  contact_email?: string;
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
