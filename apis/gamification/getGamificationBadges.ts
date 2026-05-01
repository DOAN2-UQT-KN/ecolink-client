import requestApi from '@/utils/requestApi';
import type {
  IGetAdminGamificationBadgesRequest,
  IGetAdminGamificationBadgesResponse,
  IGetMyGamificationBadgesRequest,
  IGetMyGamificationBadgesResponse,
} from '@/apis/gamification/models/gamificationBadge';
import { useGet, type UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/me/badges';
const adminUrl = '/api/v1/admin/gamification/badges';

export const getMyGamificationBadges = async (
  req: IGetMyGamificationBadgesRequest,
): Promise<IGetMyGamificationBadgesResponse> => {
  return await requestApi.get<IGetMyGamificationBadgesResponse>(url, req);
};

export const useGetMyGamificationBadges = (
  req: IGetMyGamificationBadgesRequest,
  options?: Omit<UseGetOptions<IGetMyGamificationBadgesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gamification', 'badges', req],
    queryFn: () => getMyGamificationBadges(req),
    ...options,
  });
};

export const getAdminGamificationBadges = async (
  req: IGetAdminGamificationBadgesRequest,
): Promise<IGetAdminGamificationBadgesResponse> => {
  return await requestApi.get<IGetAdminGamificationBadgesResponse>(adminUrl, req);
};

export const useGetAdminGamificationBadges = (
  req: IGetAdminGamificationBadgesRequest,
  options?: Omit<UseGetOptions<IGetAdminGamificationBadgesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gamification', 'admin', 'badges', req],
    queryFn: () => getAdminGamificationBadges(req),
    ...options,
  });
};
