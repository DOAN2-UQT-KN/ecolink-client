import { IBaseResponse } from "@/types/BaseResponse";
import { IUser } from "./user";

export interface ISignInRequest {
  email: string;
  password: string;
}

export interface ISignInDataResponse {
  access_token: string;
  refresh_token: string;
  user: IUser;
}

export interface ISignInResponse extends IBaseResponse<ISignInDataResponse> {}
