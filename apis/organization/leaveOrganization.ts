import requestApi from "@/utils/requestApi";
import {
  ILeaveOrganizationRequest,
  ILeaveOrganizationResponse,
} from "./models/leaveOrganization";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

export const leaveOrganization = async (
  req: ILeaveOrganizationRequest,
): Promise<ILeaveOrganizationResponse> => {
  return await requestApi.delete<ILeaveOrganizationResponse>(
    `/organizations/${req.id}/members/me`,
  );
};

export const useLeaveOrganization = (
  options?: UsePostOptions<ILeaveOrganizationResponse, ILeaveOrganizationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: leaveOrganization,
    messageSuccess: {
      content: t("Left organization successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
