import { IBaseResponse } from "@/types/BaseResponse";

export interface IRequestApplicationOtpRequest {
  email: string;
}

export type IRequestApplicationOtpResponse = IBaseResponse<{
  sent: boolean;
  sent_at: string;
  expires_at: string;
}>;

export interface IResolveApplicationEmailLinkRequest {
  token: string;
}

/** The address a mailed "continue" link was issued for, plus the life of its code. */
export type IResolveApplicationEmailLinkResponse = IBaseResponse<{
  email: string;
  sent_at: string;
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
