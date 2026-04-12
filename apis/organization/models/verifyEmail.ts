import { IBaseResponse } from "@/types/BaseResponse";

export interface IVerifyEmailRequest {
  token: string;
}

export type IVerifyEmailResponse = IBaseResponse<any>;
