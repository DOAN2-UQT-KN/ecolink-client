import requestApi from "@/utils/requestApi";
import type {
  IVoteRiskSiteRequest,
  IVoteRiskSiteResponse,
} from "@/apis/risk-site/models/riskSite";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";

const url = "/api/v1/risk-sites/votes";

export const voteRiskSite = async (
  data: IVoteRiskSiteRequest,
): Promise<IVoteRiskSiteResponse> => {
  return await requestApi.post<IVoteRiskSiteResponse>(url, data);
};

/** The risk map (an iframe) shows its own toast, so this hook stays silent. */
export const useVoteRiskSite = (
  options?: UsePostOptions<IVoteRiskSiteResponse, IVoteRiskSiteRequest>,
) => {
  return usePost({
    mutationFn: voteRiskSite,
    queryKey: ["risk-sites"],
    silentError: true,
    ...options,
  });
};
