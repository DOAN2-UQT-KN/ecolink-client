import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import { IBaseResponse } from "@/types/BaseResponse";

const url = "/api/v1/auth/sign-out";

export const signOut = async (): Promise<IBaseResponse> => {
  return await requestApi.post<IBaseResponse>(url, {});
};

export const useSignOut = (
  options: UsePostOptions<IBaseResponse, void>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: signOut,
    messageSuccess: {
      content: t("Sign out successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
