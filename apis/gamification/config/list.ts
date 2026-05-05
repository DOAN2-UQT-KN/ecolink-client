import requestApi from "@/utils/requestApi";
import { useGet, usePost, type UseGetOptions, type UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  IAdminCreatePayoutTierBody,
  IAdminCreatePayoutTierResponse,
  IAdminDeletePayoutTierResponse,
  IAdminGetPointRulesResponse,
  IAdminGetSpRulesResponse,
  IAdminListMultipliersResponse,
  IAdminListPayoutTiersResponse,
  IAdminListSeasonSchedulesResponse,
  IAdminPatchPayoutTierBody,
  IAdminPatchPayoutTierResponse,
  IAdminPatchPointRulesResponse,
  IAdminPatchSpRulesResponse,
  IAdminPayoutTiersQuery,
  IAdminPointRulesBody,
  IAdminPutMultiplierBody,
  IAdminPutMultiplierResponse,
  IAdminPutSeasonScheduleBody,
  IAdminPutSeasonScheduleResponse,
  IAdminSpRulesBody,
} from "./models";

const adminGamificationUrl = "/api/v1/admin/gamification";

export const getAdminPointRules = async (): Promise<IAdminGetPointRulesResponse> => {
  return await requestApi.get<IAdminGetPointRulesResponse>(
    `${adminGamificationUrl}/point-rules`,
  );
};

export const useGetAdminPointRules = (
  options?: Omit<UseGetOptions<IAdminGetPointRulesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "point-rules"],
    queryFn: () => getAdminPointRules(),
    ...options,
  });
};

export const patchAdminPointRules = async (
  body: IAdminPointRulesBody,
): Promise<IAdminPatchPointRulesResponse> => {
  return await requestApi.patch<IAdminPatchPointRulesResponse>(
    `${adminGamificationUrl}/point-rules`,
    body,
  );
};

export const getAdminSpRules = async (): Promise<IAdminGetSpRulesResponse> => {
  return await requestApi.get<IAdminGetSpRulesResponse>(`${adminGamificationUrl}/sp-rules`);
};

export const useGetAdminSpRules = (
  options?: Omit<UseGetOptions<IAdminGetSpRulesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "sp-rules"],
    queryFn: () => getAdminSpRules(),
    ...options,
  });
};

export const patchAdminSpRules = async (
  body: IAdminSpRulesBody,
): Promise<IAdminPatchSpRulesResponse> => {
  return await requestApi.patch<IAdminPatchSpRulesResponse>(
    `${adminGamificationUrl}/sp-rules`,
    body,
  );
};

export const listAdminMultipliers = async (): Promise<IAdminListMultipliersResponse> => {
  return await requestApi.get<IAdminListMultipliersResponse>(
    `${adminGamificationUrl}/multipliers`,
  );
};

export const useListAdminMultipliers = (
  options?: Omit<UseGetOptions<IAdminListMultipliersResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "multipliers"],
    queryFn: () => listAdminMultipliers(),
    ...options,
  });
};

export const putAdminMultiplier = async (
  body: IAdminPutMultiplierBody,
): Promise<IAdminPutMultiplierResponse> => {
  return await requestApi.put<IAdminPutMultiplierResponse>(
    `${adminGamificationUrl}/multipliers`,
    body,
  );
};

export const listAdminSeasonSchedules = async (): Promise<IAdminListSeasonSchedulesResponse> => {
  return await requestApi.get<IAdminListSeasonSchedulesResponse>(
    `${adminGamificationUrl}/season-schedules`,
  );
};

export const useListAdminSeasonSchedules = (
  options?: Omit<UseGetOptions<IAdminListSeasonSchedulesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "season-schedules"],
    queryFn: () => listAdminSeasonSchedules(),
    ...options,
  });
};

export const putAdminSeasonSchedule = async (
  body: IAdminPutSeasonScheduleBody,
): Promise<IAdminPutSeasonScheduleResponse> => {
  return await requestApi.put<IAdminPutSeasonScheduleResponse>(
    `${adminGamificationUrl}/season-schedules`,
    body,
  );
};

export const listAdminPayoutTiers = async (
  req: IAdminPayoutTiersQuery,
): Promise<IAdminListPayoutTiersResponse> => {
  return await requestApi.get<IAdminListPayoutTiersResponse>(
    `${adminGamificationUrl}/payout-tiers`,
    req,
  );
};

export const useListAdminPayoutTiers = (
  req: IAdminPayoutTiersQuery,
  options?: Omit<UseGetOptions<IAdminListPayoutTiersResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "payout-tiers", req],
    queryFn: () => listAdminPayoutTiers(req),
    ...options,
  });
};

export const createAdminPayoutTier = async (
  body: IAdminCreatePayoutTierBody,
): Promise<IAdminCreatePayoutTierResponse> => {
  return await requestApi.post<IAdminCreatePayoutTierResponse>(
    `${adminGamificationUrl}/payout-tiers`,
    body,
  );
};

export const patchAdminPayoutTier = async (req: {
  id: string;
  body: IAdminPatchPayoutTierBody;
}): Promise<IAdminPatchPayoutTierResponse> => {
  const { id, body } = req;
  return await requestApi.patch<IAdminPatchPayoutTierResponse>(
    `${adminGamificationUrl}/payout-tiers/${id}`,
    body,
  );
};

export const deleteAdminPayoutTier = async (
  id: string,
): Promise<IAdminDeletePayoutTierResponse> => {
  return await requestApi.delete<IAdminDeletePayoutTierResponse>(
    `${adminGamificationUrl}/payout-tiers/${id}`,
  );
};

export const usePatchAdminPointRules = (
  options?: UsePostOptions<IAdminPatchPointRulesResponse, IAdminPointRulesBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminPointRules,
    queryKey: ["gamification", "admin", "point-rules"],
    messageSuccess: { content: t("Point rules updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePatchAdminSpRules = (
  options?: UsePostOptions<IAdminPatchSpRulesResponse, IAdminSpRulesBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminSpRules,
    queryKey: ["gamification", "admin", "sp-rules"],
    messageSuccess: { content: t("SP rules updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePutAdminMultiplier = (
  options?: UsePostOptions<IAdminPutMultiplierResponse, IAdminPutMultiplierBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: putAdminMultiplier,
    queryKey: ["gamification", "admin", "multipliers"],
    messageSuccess: { content: t("Multiplier updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePutAdminSeasonSchedule = (
  options?: UsePostOptions<IAdminPutSeasonScheduleResponse, IAdminPutSeasonScheduleBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: putAdminSeasonSchedule,
    queryKey: ["gamification", "admin", "season-schedules"],
    messageSuccess: { content: t("Season schedule updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useCreateAdminPayoutTier = (
  options?: UsePostOptions<IAdminCreatePayoutTierResponse, IAdminCreatePayoutTierBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createAdminPayoutTier,
    queryKey: ["gamification", "admin", "payout-tiers"],
    messageSuccess: { content: t("Payout tier created successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePatchAdminPayoutTier = (
  options?: UsePostOptions<
    IAdminPatchPayoutTierResponse,
    { id: string; body: IAdminPatchPayoutTierBody }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminPayoutTier,
    queryKey: ["gamification", "admin", "payout-tiers"],
    messageSuccess: { content: t("Payout tier updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useDeleteAdminPayoutTier = (
  options?: UsePostOptions<IAdminDeletePayoutTierResponse, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: deleteAdminPayoutTier,
    queryKey: ["gamification", "admin", "payout-tiers"],
    messageSuccess: { content: t("Payout tier deleted successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
