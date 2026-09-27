import requestApi from "@/utils/requestApi";
import {
  IActivateAccountRequest,
  IActivateAccountResponse,
  IResendActivationRequest,
  IResendActivationResponse,
} from "./models/activateAccount";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/auth/activate-account";
const resendUrl = "/api/v1/auth/activation/resend";

export const activateAccount = async (
  req: IActivateAccountRequest,
): Promise<IActivateAccountResponse> => {
  return await requestApi.post<IActivateAccountResponse>(url, req);
};

export const useActivateAccount = (
  options: UsePostOptions<IActivateAccountResponse, IActivateAccountRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: activateAccount,
    messageSuccess: {
      content: t("Account activated, you can sign in now"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const resendActivation = async (
  req: IResendActivationRequest,
): Promise<IResendActivationResponse> => {
  return await requestApi.post<IResendActivationResponse>(resendUrl, req);
};

export const useResendActivation = (
  options?: UsePostOptions<IResendActivationResponse, IResendActivationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resendActivation,
    messageSuccess: {
      content: t(
        "If this email has an account waiting for activation, a new link is on its way",
      ),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
