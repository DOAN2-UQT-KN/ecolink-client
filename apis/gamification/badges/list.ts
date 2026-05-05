import requestApi from "@/utils/requestApi";
import { useGet, usePost, type UseGetOptions, type UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  ICreateAdminBadgeBody,
  ICreateAdminBadgeResponse,
  IGetAdminGamificationBadgesRequest,
  IGetAdminGamificationBadgesResponse,
  IGetMyGamificationBadgesRequest,
  IGetMyGamificationBadgesResponse,
  IPatchAdminBadgeBody,
  IPatchAdminBadgeResponse,
} from "./models";

const myBadgesUrl = "/api/v1/me/badges";
const adminBadgesUrl = "/api/v1/admin/gamification/badges";

export const getMyGamificationBadges = async (
  req: IGetMyGamificationBadgesRequest,
): Promise<IGetMyGamificationBadgesResponse> => {
  return await requestApi.get<IGetMyGamificationBadgesResponse>(myBadgesUrl, req);
};

export const useGetMyGamificationBadges = (
  req: IGetMyGamificationBadgesRequest,
  options?: Omit<UseGetOptions<IGetMyGamificationBadgesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "badges", req],
    queryFn: () => getMyGamificationBadges(req),
    ...options,
  });
};

export const getAdminGamificationBadges = async (
  req: IGetAdminGamificationBadgesRequest,
): Promise<IGetAdminGamificationBadgesResponse> => {
  return await requestApi.get<IGetAdminGamificationBadgesResponse>(adminBadgesUrl, req);
};

export const useGetAdminGamificationBadges = (
  req: IGetAdminGamificationBadgesRequest,
  options?: Omit<UseGetOptions<IGetAdminGamificationBadgesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "badges", req],
    queryFn: () => getAdminGamificationBadges(req),
    ...options,
  });
};

export const createAdminBadge = async (
  body: ICreateAdminBadgeBody,
): Promise<ICreateAdminBadgeResponse> => {
  return await requestApi.post<ICreateAdminBadgeResponse>(adminBadgesUrl, body);
};

export const patchAdminBadge = async (req: {
  id: string;
  body: IPatchAdminBadgeBody;
}): Promise<IPatchAdminBadgeResponse> => {
  const { id, body } = req;
  return await requestApi.patch<IPatchAdminBadgeResponse>(
    `${adminBadgesUrl}/${id}`,
    body,
  );
};

export const useCreateAdminBadge = (
  options?: UsePostOptions<ICreateAdminBadgeResponse, ICreateAdminBadgeBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createAdminBadge,
    queryKey: ["gamification", "admin", "badges"],
    messageSuccess: { content: t("Badge created successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePatchAdminBadge = (
  options?: UsePostOptions<
    IPatchAdminBadgeResponse,
    { id: string; body: IPatchAdminBadgeBody }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminBadge,
    queryKey: ["gamification", "admin", "badges"],
    messageSuccess: { content: t("Badge updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
