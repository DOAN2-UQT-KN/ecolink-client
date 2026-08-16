import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export type IGetOrganizationBySlugResponse = IBaseResponse<{
  organization: IOrganization;
}>;
