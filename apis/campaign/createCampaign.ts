import requestApi from "@/utils/requestApi";
import {
  ICreateCampaignResponse,
  ICreateCampaignRequest,
} from "./models/createCampaign";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

export const createCampaign = async (
  req: ICreateCampaignRequest,
): Promise<ICreateCampaignResponse> => {
  return await requestApi.post<ICreateCampaignResponse>(url, req);
};

export const useCreateCampaign = (
  options?: UsePostOptions<ICreateCampaignResponse, ICreateCampaignRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createCampaign,
    messageSuccess: {
      content: t("Campaign created successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
