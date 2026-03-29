import { IBaseResponse } from "@/types/BaseResponse";

export interface IResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface IResetPasswordResponse extends IBaseResponse<void> {}
