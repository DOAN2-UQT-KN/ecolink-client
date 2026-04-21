import requestApi from "@/utils/requestApi";
import {
  IRefreshTokenRequest,
  IRefreshTokenResponse,
} from "./models/refreshToken";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/auth/refresh-token";

export const refreshToken = async (
  req: IRefreshTokenRequest,
): Promise<IRefreshTokenResponse> => {
  return await requestApi.post<IRefreshTokenResponse>(url, req);
};

export const useRefreshToken = (
  options: UsePostOptions<IRefreshTokenResponse, IRefreshTokenRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: refreshToken,
    messageSuccess: {
      content: t("Refresh token successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
