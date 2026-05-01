import requestApi from "@/utils/requestApi";
import type { IGetSeasonByIdResponse } from "@/apis/gamification/models/season";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

export const getSeasonById = async (
  id: string,
): Promise<IGetSeasonByIdResponse> => {
  return await requestApi.get<IGetSeasonByIdResponse>(
    `/api/v1/seasons/${id}`,
  );
};

export const useGetSeasonById = (
  id: string | undefined,
  options?: Omit<UseGetOptions<IGetSeasonByIdResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "season", id],
    queryFn: () => getSeasonById(id as string),
    enabled: Boolean(id),
    ...options,
  });
};
