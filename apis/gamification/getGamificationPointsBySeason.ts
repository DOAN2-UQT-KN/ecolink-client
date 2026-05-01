import requestApi from "@/utils/requestApi";
import type {
  IGetGamificationPointsBySeasonRequest,
  IGetGamificationPointsBySeasonResponse,
} from "@/apis/gamification/models/pointsBySeason";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/me/gamification/points-by-season";

export const getGamificationPointsBySeason = async (
  req: IGetGamificationPointsBySeasonRequest,
): Promise<IGetGamificationPointsBySeasonResponse> => {
  return await requestApi.get<IGetGamificationPointsBySeasonResponse>(
    url,
    req,
  );
};

export const useGetGamificationPointsBySeason = (
  req: IGetGamificationPointsBySeasonRequest,
  options?: Omit<
    UseGetOptions<IGetGamificationPointsBySeasonResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "points-by-season", req],
    queryFn: () => getGamificationPointsBySeason(req),
    ...options,
  });
};
