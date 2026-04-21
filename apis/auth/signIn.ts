import requestApi from "@/utils/requestApi";
import { ISignInRequest, ISignInResponse } from "./models/signIn";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/auth/sign-in";

export const signIn = async (req: ISignInRequest): Promise<ISignInResponse> => {
  return await requestApi.post<ISignInResponse>(url, req);
};

export const useSignIn = (
  options: UsePostOptions<ISignInResponse, ISignInRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: signIn,
    messageSuccess: {
      content: t("Sign in successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
