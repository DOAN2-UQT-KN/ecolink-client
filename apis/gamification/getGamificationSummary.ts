import requestApi from "@/utils/requestApi";
import type { IGetGamificationSummaryResponse } from "@/apis/gamification/models/gamificationSummary";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/me/gamification/summary";

export const getGamificationSummary =
  async (): Promise<IGetGamificationSummaryResponse> => {
    return await requestApi.get<IGetGamificationSummaryResponse>(url);
  };

export const useGetGamificationSummary = (
  options?: Omit<
    UseGetOptions<IGetGamificationSummaryResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "summary"],
    queryFn: () => getGamificationSummary(),
    ...options,
  });
};
