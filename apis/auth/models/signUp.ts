import { IBaseResponse } from "@/types/BaseResponse";
import { IUser } from "./user";

export interface ISignUpRequest {
  email: string;
  password: string;
  name: string;
  roleId?: string;
}

export interface ISignUpResponse extends IBaseResponse<IUser> {}
