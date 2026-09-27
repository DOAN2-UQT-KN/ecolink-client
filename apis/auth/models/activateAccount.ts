import { IBaseResponse } from "@/types/BaseResponse";

export interface IActivateAccountRequest {
  /** Single-use token from the activation email sent to an approved owner with no account. */
  token: string;
  newPassword: string;
}

export type IActivateAccountResponse = IBaseResponse<void>;

export interface IResendActivationRequest {
  email: string;
}

/** Always succeeds: the server never reveals whether the email has a pending account. */
export type IResendActivationResponse = IBaseResponse<void>;
