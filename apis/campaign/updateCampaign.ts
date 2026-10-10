import requestApi from "@/utils/requestApi";
import type { UpdateCampaignParams } from "./models/createCampaign";
import type { ICampaignMutationResponse } from "./models/lifecycle";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

export const updateCampaign = async ({
  id,
  data,
}: UpdateCampaignParams): Promise<ICampaignMutationResponse> => {
  return await requestApi.put<ICampaignMutationResponse>(`${url}/${id}`, data);
};

export const useUpdateCampaign = (
  options?: UsePostOptions<ICampaignMutationResponse, UpdateCampaignParams>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateCampaign,
    messageSuccess: { content: t("Campaign updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
