import requestApi from "@/utils/requestApi";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";
import type {
  IGetCampaignRewardEstimateRequest,
  IGetCampaignRewardEstimateResponse,
  IGetGamificationLeaderboardMeRequest,
  IGetGamificationLeaderboardMeResponse,
  IGetGamificationLeaderboardRequest,
  IGetGamificationLeaderboardResponse,
  IGetGamificationPointTransactionsRequest,
  IGetGamificationPointTransactionsResponse,
  IGetGamificationPointsBySeasonRequest,
  IGetGamificationPointsBySeasonResponse,
  IGetGamificationSummaryResponse,
} from "./models";

const meGamificationUrl = "/api/v1/me/gamification";

export const getGamificationSummary = async (): Promise<IGetGamificationSummaryResponse> => {
  return await requestApi.get<IGetGamificationSummaryResponse>(
    `${meGamificationUrl}/summary`,
  );
};

export const useGetGamificationSummary = (
  options?: Omit<UseGetOptions<IGetGamificationSummaryResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "summary"],
    queryFn: () => getGamificationSummary(),
    ...options,
  });
};

export const getGamificationPointTransactions = async (
  req: IGetGamificationPointTransactionsRequest,
): Promise<IGetGamificationPointTransactionsResponse> => {
  return await requestApi.get<IGetGamificationPointTransactionsResponse>(
    `${meGamificationUrl}/point-transactions`,
    req,
  );
};

export const useGetGamificationPointTransactions = (
  req: IGetGamificationPointTransactionsRequest,
  options?: Omit<
    UseGetOptions<IGetGamificationPointTransactionsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "point-transactions", req],
    queryFn: () => getGamificationPointTransactions(req),
    ...options,
  });
};

export const getGamificationPointsBySeason = async (
  req: IGetGamificationPointsBySeasonRequest,
): Promise<IGetGamificationPointsBySeasonResponse> => {
  return await requestApi.get<IGetGamificationPointsBySeasonResponse>(
    `${meGamificationUrl}/points-by-season`,
    req,
  );
};

export const useGetGamificationPointsBySeason = (
  req: IGetGamificationPointsBySeasonRequest,
  options?: Omit<UseGetOptions<IGetGamificationPointsBySeasonResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "points-by-season", req],
    queryFn: () => getGamificationPointsBySeason(req),
    ...options,
  });
};

export const getCampaignRewardEstimate = async (
  req: IGetCampaignRewardEstimateRequest,
): Promise<IGetCampaignRewardEstimateResponse> => {
  return await requestApi.get<IGetCampaignRewardEstimateResponse>(
    "/api/v1/gamification/campaign-reward-estimate",
    req,
  );
};

export const useGetCampaignRewardEstimate = (
  req: IGetCampaignRewardEstimateRequest,
  options?: Omit<UseGetOptions<IGetCampaignRewardEstimateResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "campaign-reward-estimate", req],
    queryFn: () => getCampaignRewardEstimate(req),
    ...options,
  });
};

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
  options?: Omit<UseGetOptions<IGetGamificationLeaderboardResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "leaderboard", req],
    queryFn: () => getGamificationLeaderboard(req),
    ...options,
  });
};

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
  options?: Omit<UseGetOptions<IGetGamificationLeaderboardMeResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "leaderboard-me", req],
    queryFn: () => getGamificationLeaderboardMe(req),
    ...options,
  });
};
