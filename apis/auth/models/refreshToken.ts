import { IBaseResponse } from "@/types/BaseResponse";

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IRefreshTokenData {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshTokenResponse extends IBaseResponse<IRefreshTokenData> {}
