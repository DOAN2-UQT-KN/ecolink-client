import requestApi from "@/utils/requestApi";
import type { IGetSeasonCurrentResponse } from "@/apis/gamification/models/season";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/seasons/current";

export const getSeasonCurrent =
  async (): Promise<IGetSeasonCurrentResponse> => {
    return await requestApi.get<IGetSeasonCurrentResponse>(url);
  };

export const useGetSeasonCurrent = (
  options?: Omit<
    UseGetOptions<IGetSeasonCurrentResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "season-current"],
    queryFn: () => getSeasonCurrent(),
    ...options,
  });
};
