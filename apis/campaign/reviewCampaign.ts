import requestApi from "@/utils/requestApi";
import type {
  ICampaignMutationResponse,
  IReviewCampaignRequest,
} from "./models/lifecycle";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

/** Admin: approve, request changes to, or block a campaign waiting for review. */
export const reviewCampaign = async ({
  id,
  ...body
}: IReviewCampaignRequest): Promise<ICampaignMutationResponse> => {
  return await requestApi.put<ICampaignMutationResponse>(`${url}/${id}/review`, body);
};

export const useReviewCampaign = (
  options?: UsePostOptions<ICampaignMutationResponse, IReviewCampaignRequest>,
) => {
  return usePost({
    mutationFn: reviewCampaign,
    queryKey: ["campaigns"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
