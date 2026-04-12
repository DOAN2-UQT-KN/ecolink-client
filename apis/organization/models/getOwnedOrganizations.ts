import { IBaseResponse } from "@/types/BaseResponse";
import { IOrganization } from "./organization";

export type IGetOwnedOrganizationsResponse = IBaseResponse<{
  organizations: IOrganization[];
}>;
