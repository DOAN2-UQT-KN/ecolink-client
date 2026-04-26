import requestApi from "@/utils/requestApi";
import { ISignUpRequest, ISignUpResponse } from "./models/signUp";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/auth/sign-up";

export const signUp = async (req: ISignUpRequest): Promise<ISignUpResponse> => {
  return await requestApi.post<ISignUpResponse>(url, req);
};

export const useSignUp = (
  options: UsePostOptions<ISignUpResponse, ISignUpRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: signUp,
    messageSuccess: {
      content: t("Sign up successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
