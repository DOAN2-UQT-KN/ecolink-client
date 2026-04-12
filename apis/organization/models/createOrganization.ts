import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export interface ICreateOrganizationRequest {
  name: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
}

export type ICreateOrganizationResponse = IBaseResponse<{
  organization: IOrganization;
}>;
