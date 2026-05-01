import requestApi from "@/utils/requestApi";
import type {
  IGetCampaignRewardEstimateRequest,
  IGetCampaignRewardEstimateResponse,
} from "@/apis/gamification/models/campaignRewardEstimate";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/gamification/campaign-reward-estimate";

export const getCampaignRewardEstimate = async (
  req: IGetCampaignRewardEstimateRequest,
): Promise<IGetCampaignRewardEstimateResponse> => {
  return await requestApi.get<IGetCampaignRewardEstimateResponse>(url, req);
};

export const useGetCampaignRewardEstimate = (
  req: IGetCampaignRewardEstimateRequest,
  options?: Omit<
    UseGetOptions<IGetCampaignRewardEstimateResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "campaign-reward-estimate", req],
    queryFn: () => getCampaignRewardEstimate(req),
    ...options,
  });
};
