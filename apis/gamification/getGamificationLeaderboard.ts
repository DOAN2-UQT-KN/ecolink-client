import requestApi from "@/utils/requestApi";
import type {
  IGetGamificationLeaderboardRequest,
  IGetGamificationLeaderboardResponse,
} from "@/apis/gamification/models/gamificationLeaderboard";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

export const getGamificationLeaderboard = async (
  req: IGetGamificationLeaderboardRequest,
): Promise<IGetGamificationLeaderboardResponse> => {
  const { metric, ...params } = req;
  return await requestApi.get<IGetGamificationLeaderboardResponse>(
    `/api/v1/gamification/leaderboards/${metric}`,
    params,
  );
};

export const useGetGamificationLeaderboard = (
  req: IGetGamificationLeaderboardRequest,
  options?: Omit<
    UseGetOptions<IGetGamificationLeaderboardResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "leaderboard", req],
    queryFn: () => getGamificationLeaderboard(req),
    ...options,
  });
};
