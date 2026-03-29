import { IBaseResponse } from "@/types/BaseResponse";

export interface IRequestPasswordResetRequest {
  email: string;
}

export interface IRequestPasswordResetResponse
  extends IBaseResponse<{ resetToken: string }> {}
