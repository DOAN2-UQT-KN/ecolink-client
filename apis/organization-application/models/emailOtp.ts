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

/**
 * The code opens (or reopens) the mailbox's draft. The tracking token is the credential for
 * every later call (`?token=`), and it is also what the tracking link carries.
 */
export type IVerifyApplicationOtpResponse = IBaseResponse<{
  application_id: string;
  tracking_token: string;
  /** True when an open application already existed and was handed back. */
  resumed: boolean;
}>;
