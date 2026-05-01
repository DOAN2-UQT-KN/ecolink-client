import requestApi from "@/utils/requestApi";
import type {
  IGetGamificationLeaderboardMeRequest,
  IGetGamificationLeaderboardMeResponse,
} from "@/apis/gamification/models/gamificationLeaderboard";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

export const getGamificationLeaderboardMe = async (
  req: IGetGamificationLeaderboardMeRequest,
): Promise<IGetGamificationLeaderboardMeResponse> => {
  const { metric, ...params } = req;
  return await requestApi.get<IGetGamificationLeaderboardMeResponse>(
    `/api/v1/gamification/leaderboards/${metric}/me`,
    params,
  );
};

export const useGetGamificationLeaderboardMe = (
  req: IGetGamificationLeaderboardMeRequest,
  options?: Omit<
    UseGetOptions<IGetGamificationLeaderboardMeResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "leaderboard-me", req],
    queryFn: () => getGamificationLeaderboardMe(req),
    ...options,
  });
};
