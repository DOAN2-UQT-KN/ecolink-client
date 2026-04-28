import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { IUser } from '@/apis/auth/models/user';

export interface IUpdateUserRequest {
  name?: string;
  avatar?: string;
  bio?: string;
  roleId?: string;
}

export const updateUser = async (
  userId: string,
  body: IUpdateUserRequest,
): Promise<IBaseResponse<{ user: IUser }>> => {
  return await requestApi.put<IBaseResponse<{ user: IUser }>>(`/api/v1/users/${userId}`, body);
};

