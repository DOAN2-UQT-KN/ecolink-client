import { IBaseResponse } from "@/types/BaseResponse";

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  roleId: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetMeResponse extends IBaseResponse<{ user: IUser }> {}
