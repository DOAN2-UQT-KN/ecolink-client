import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";
import { IGetCampaignByIdResponse } from "./models/campaignById";

const url = "/api/v1/campaigns";

export const getCampaignById = async (
  id: string,
): Promise<IGetCampaignByIdResponse> => {
  return await requestApi.get<IGetCampaignByIdResponse>(`${url}/${id}`);
};

export const useGetCampaignById = (
  id: string,
  options?: Omit<
    UseGetOptions<IGetCampaignByIdResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["campaign", id],
    queryFn: () => getCampaignById(id),
    ...options,
  });
};
