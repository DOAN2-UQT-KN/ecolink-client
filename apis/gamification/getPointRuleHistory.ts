import requestApi from "@/utils/requestApi";
import type {
  IGetPointRuleHistoryRequest,
  IGetPointRuleHistoryResponse,
} from "@/apis/gamification/models/pointRules";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/admin/gamification/point-rules/history";

export const getPointRuleHistory = async (
  req: IGetPointRuleHistoryRequest,
): Promise<IGetPointRuleHistoryResponse> => {
  return await requestApi.get<IGetPointRuleHistoryResponse>(url, req);
};

export const useGetPointRuleHistory = (
  req: IGetPointRuleHistoryRequest,
  options?: Omit<UseGetOptions<IGetPointRuleHistoryResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["admin-point-rule-history", req],
    queryFn: () => getPointRuleHistory(req),
    ...options,
  });
};
