import requestApi from "@/utils/requestApi";
import {
  IResetPasswordRequest,
  IResetPasswordResponse,
} from "./models/resetPassword";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/auth/reset-password";

export const resetPassword = async (
  req: IResetPasswordRequest,
): Promise<IResetPasswordResponse> => {
  return await requestApi.post<IResetPasswordResponse>(url, req);
};

export const useResetPassword = (
  options: UsePostOptions<IResetPasswordResponse, IResetPasswordRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resetPassword,
    messageSuccess: {
      content: t("Reset password successfully!"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
