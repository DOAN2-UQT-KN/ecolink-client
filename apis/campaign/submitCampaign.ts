import requestApi from "@/utils/requestApi";
import type { ICampaignMutationResponse } from "./models/lifecycle";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

/** Sends a draft, or a campaign that needs revision, for admin review. */
export const submitCampaign = async (id: string): Promise<ICampaignMutationResponse> => {
  return await requestApi.post<ICampaignMutationResponse>(`${url}/${id}/submit`, {});
};

export const useSubmitCampaign = (
  options?: UsePostOptions<ICampaignMutationResponse, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: submitCampaign,
    queryKey: ["my-campaigns"],
    messageSuccess: { content: t("Campaign sent for review"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
