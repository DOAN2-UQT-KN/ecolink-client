import requestApi from "@/utils/requestApi";
import type { IGetCampaignHistoryResponse } from "./models/lifecycle";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/campaigns";

export const getCampaignHistory = async (
  id: string,
): Promise<IGetCampaignHistoryResponse> => {
  return await requestApi.get<IGetCampaignHistoryResponse>(`${url}/${id}/history`);
};

export const useGetCampaignHistory = (
  id: string | undefined,
  options?: Omit<UseGetOptions<IGetCampaignHistoryResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["campaign-history", id],
    queryFn: () => getCampaignHistory(id as string),
    enabled: Boolean(id),
    ...options,
  });
};
