import requestApi from "@/utils/requestApi";
import {
  IGetModerationQueueRequest,
  IGetModerationQueueResponse,
} from "./models/moderation";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports/moderation";

export const getModerationQueue = async (
  req: IGetModerationQueueRequest,
): Promise<IGetModerationQueueResponse> => {
  return await requestApi.get<IGetModerationQueueResponse>(url, req);
};

export const useGetModerationQueue = (
  req: IGetModerationQueueRequest,
  options?: Omit<
    UseGetOptions<IGetModerationQueueResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["reports", "moderation", req],
    queryFn: () => getModerationQueue(req),
    ...options,
  });
};
