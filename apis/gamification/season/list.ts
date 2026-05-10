import requestApi from "@/utils/requestApi";
import { useGet, usePost, type UseGetOptions, type UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  IAdminFinalizeSeasonResponse,
  IAdminSeasonsQuery,
  ICreateAdminSeasonResponse,
  ICreateSeasonBody,
  IFinalizeSeasonBody,
  IGetAdminSeasonsResponse,
  IGetSeasonByIdResponse,
  IGetSeasonCurrentResponse,
  IPatchAdminSeasonResponse,
  IPatchSeasonBody,
} from "./models";

const seasonsUrl = "/api/v1/seasons";
const adminSeasonsUrl = "/api/v1/admin/seasons";

export const getSeasonCurrent = async (): Promise<IGetSeasonCurrentResponse> => {
  return await requestApi.get<IGetSeasonCurrentResponse>(`${seasonsUrl}/current`);
};

export const useGetSeasonCurrent = (
  options?: Omit<UseGetOptions<IGetSeasonCurrentResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "season-current"],
    queryFn: () => getSeasonCurrent(),
    ...options,
  });
};

export const getSeasonById = async (id: string): Promise<IGetSeasonByIdResponse> => {
  return await requestApi.get<IGetSeasonByIdResponse>(`${seasonsUrl}/${id}`);
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

export const getAdminSeasons = async (
  req: IAdminSeasonsQuery,
): Promise<IGetAdminSeasonsResponse> => {
  return await requestApi.get<IGetAdminSeasonsResponse>(adminSeasonsUrl, req);
};

export const useGetAdminSeasons = (
  req: IAdminSeasonsQuery,
  options?: Omit<UseGetOptions<IGetAdminSeasonsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "admin", "seasons", req],
    queryFn: () => getAdminSeasons(req),
    ...options,
  });
};

export const createAdminSeason = async (
  body: ICreateSeasonBody,
): Promise<ICreateAdminSeasonResponse> => {
  return await requestApi.post<ICreateAdminSeasonResponse>(adminSeasonsUrl, body);
};

export const patchAdminSeason = async (req: {
  id: string;
  body: IPatchSeasonBody;
}): Promise<IPatchAdminSeasonResponse> => {
  const { id, body } = req;
  return await requestApi.patch<IPatchAdminSeasonResponse>(
    `${adminSeasonsUrl}/${id}`,
    body,
  );
};

export const finalizeAdminSeason = async (req: {
  id: string;
  openNext?: boolean;
  body?: IFinalizeSeasonBody;
}): Promise<IAdminFinalizeSeasonResponse> => {
  const { id, openNext, body } = req;
  const query = openNext === undefined ? "" : `?openNext=${openNext ? "true" : "false"}`;
  return await requestApi.post<IAdminFinalizeSeasonResponse>(
    `${adminSeasonsUrl}/${id}/finalize${query}`,
    body ?? {},
  );
};

export const useCreateAdminSeason = (
  options?: UsePostOptions<ICreateAdminSeasonResponse, ICreateSeasonBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createAdminSeason,
    queryKey: ["gamification", "admin", "seasons"],
    messageSuccess: { content: t("Season created successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePatchAdminSeason = (
  options?: UsePostOptions<IPatchAdminSeasonResponse, { id: string; body: IPatchSeasonBody }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminSeason,
    queryKey: ["gamification", "admin", "seasons"],
    messageSuccess: { content: t("Season updated successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useFinalizeAdminSeason = (
  options?: UsePostOptions<
    IAdminFinalizeSeasonResponse,
    { id: string; openNext?: boolean; body?: IFinalizeSeasonBody }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: finalizeAdminSeason,
    queryKey: ["gamification", "admin", "seasons"],
    messageSuccess: { content: t("Season finalized successfully"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
