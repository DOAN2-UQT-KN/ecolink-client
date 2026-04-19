import requestApi from "@/utils/requestApi";
import type { IGetGiftsRequest, IGetGiftsResponse } from "@/apis/gift/models/gift";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/gifts";

export const getGifts = async (req: IGetGiftsRequest): Promise<IGetGiftsResponse> => {
  return await requestApi.get<IGetGiftsResponse>(url, req);
};

export const useGetGifts = (
  req: IGetGiftsRequest,
  options?: Omit<UseGetOptions<IGetGiftsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gifts", req],
    queryFn: () => getGifts(req),
    ...options,
  });
};
