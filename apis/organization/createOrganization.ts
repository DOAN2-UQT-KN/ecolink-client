import requestApi from "@/utils/requestApi";
import {
  ICreateOrganizationRequest,
  ICreateOrganizationResponse,
} from "./models/createOrganization";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/organizations";

export const createOrganization = async (
  req: ICreateOrganizationRequest,
): Promise<ICreateOrganizationResponse> => {
  return await requestApi.post<ICreateOrganizationResponse>(url, req);
};

export const useCreateOrganization = (
  options?: UsePostOptions<ICreateOrganizationResponse, ICreateOrganizationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createOrganization,
    messageSuccess: {
      content: t("Organization created successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
