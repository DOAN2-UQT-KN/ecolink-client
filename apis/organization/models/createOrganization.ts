import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface ICreateOrganizationRequest {
  name: string;
  description: string;
  logo_url: string;
  background_url: string;
  contact_email: string;
}

export type ICreateOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;
