import { IBaseResponse } from "@/types/BaseResponse";

export interface IActivateOrgAccountRequest {
  /** Single-use token from the activation email sent after the application was approved. */
  token: string;
  newPassword: string;
}

export interface IActivateOrgAccountResponse extends IBaseResponse<void> {}
