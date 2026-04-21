import requestApi from "@/utils/requestApi";
import type { IBaseResponse } from "@/types/BaseResponse";

export interface IRegisterAdminMediaRequest {
  image_url: string;
}

export type IRegisterAdminMediaResponse = IBaseResponse<{
  media: {
    id: string;
    url: string;
    type: string;
  };
}>;

const url = "/api/v1/admin/media";

export const registerAdminMedia = async (
  data: IRegisterAdminMediaRequest,
): Promise<IRegisterAdminMediaResponse> => {
  return await requestApi.post<IRegisterAdminMediaResponse>(url, data);
};
