import { IBaseResponse } from "@/types/BaseResponse";

export interface IRequestApplicationOtpRequest {
  email: string;
}

export type IRequestApplicationOtpResponse = IBaseResponse<{
  sent: boolean;
  expires_at: string;
}>;

export interface IVerifyApplicationOtpRequest {
  email: string;
  otp: string;
}

export type IVerifyApplicationOtpResponse = IBaseResponse<{
  /** Single-use; sent back as the `x-submission-token` header on later calls. */
  submission_token: string;
  expires_at: string;
}>;
