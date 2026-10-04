import requestApi from "@/utils/requestApi";
import type { ICampaignMutationResponse } from "./models/lifecycle";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

export interface ICancelCampaignRequest {
  id: string;
  reason: string;
}

/** Creator or owner: cancel an upcoming, running or approved-and-under-review campaign (spec 3.6). */
export const cancelCampaign = async ({
  id,
  ...body
}: ICancelCampaignRequest): Promise<ICampaignMutationResponse> => {
  return await requestApi.post<ICampaignMutationResponse>(`${url}/${id}/cancel`, body);
};

export const useCancelCampaign = (
  options?: UsePostOptions<ICampaignMutationResponse, ICancelCampaignRequest>,
) => {
  return usePost({
    mutationFn: cancelCampaign,
    queryKey: ["campaign"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
