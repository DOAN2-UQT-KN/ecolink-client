import requestApi from "@/utils/requestApi";
import { IGetMeResponse } from "./models/user";

const url = "/auth/me";

export const getMe = async (): Promise<IGetMeResponse> => {
  return await requestApi.get<IGetMeResponse>(url);
};
