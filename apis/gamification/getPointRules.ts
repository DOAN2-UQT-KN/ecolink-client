import requestApi from "@/utils/requestApi";
import type { IGetPointRulesResponse } from "@/apis/gamification/models/pointRules";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/admin/gamification/point-rules";

export const getPointRules = async (): Promise<IGetPointRulesResponse> => {
  return await requestApi.get<IGetPointRulesResponse>(url);
};

export const useGetPointRules = (
  options?: Omit<UseGetOptions<IGetPointRulesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["admin-point-rules"],
    queryFn: getPointRules,
    ...options,
  });
};
