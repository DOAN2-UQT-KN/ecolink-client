import requestApi from "@/utils/requestApi";
import {
  IRequestPasswordResetRequest,
  IRequestPasswordResetResponse,
} from "./models/requestPasswordReset";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/auth/request-password-reset";

export const requestPasswordReset = async (
  req: IRequestPasswordResetRequest,
): Promise<IRequestPasswordResetResponse> => {
  return await requestApi.post<IRequestPasswordResetResponse>(url, req);
};

export const useRequestPasswordReset = (
  options: UsePostOptions<
    IRequestPasswordResetResponse,
    IRequestPasswordResetRequest
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: requestPasswordReset,
    messageSuccess: {
      content: t(
        "Request password reset successfully! Please check your email address.",
      ),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
