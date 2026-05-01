import requestApi from "@/utils/requestApi";
import type {
  IGetMyGamificationBadgesRequest,
  IGetMyGamificationBadgesResponse,
} from "@/apis/gamification/models/gamificationBadge";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/me/badges";

export const getMyGamificationBadges = async (
  req: IGetMyGamificationBadgesRequest,
): Promise<IGetMyGamificationBadgesResponse> => {
  return await requestApi.get<IGetMyGamificationBadgesResponse>(url, req);
};

export const useGetMyGamificationBadges = (
  req: IGetMyGamificationBadgesRequest,
  options?: Omit<
    UseGetOptions<IGetMyGamificationBadgesResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "badges", req],
    queryFn: () => getMyGamificationBadges(req),
    ...options,
  });
};
