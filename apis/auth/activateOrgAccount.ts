import requestApi from "@/utils/requestApi";
import {
  IActivateOrgAccountRequest,
  IActivateOrgAccountResponse,
} from "./models/activateOrgAccount";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/auth/activate-org-account";

export const activateOrgAccount = async (
  req: IActivateOrgAccountRequest,
): Promise<IActivateOrgAccountResponse> => {
  return await requestApi.post<IActivateOrgAccountResponse>(url, req);
};

export const useActivateOrgAccount = (
  options: UsePostOptions<IActivateOrgAccountResponse, IActivateOrgAccountRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: activateOrgAccount,
    messageSuccess: {
      content: t("Organization account activated, you can sign in now"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
