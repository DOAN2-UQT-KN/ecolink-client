import requestApi from "@/utils/requestApi";
import type { IGetCreateEligibilityResponse } from "./models/lifecycle";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/campaigns/create-eligibility";

export const getCreateEligibility = async (
  organizationId: string,
): Promise<IGetCreateEligibilityResponse> => {
  return await requestApi.get<IGetCreateEligibilityResponse>(url, { organizationId });
};

export const useGetCreateEligibility = (
  organizationId: string | undefined,
  options?: Omit<UseGetOptions<IGetCreateEligibilityResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["campaign-create-eligibility", organizationId],
    queryFn: () => getCreateEligibility(organizationId as string),
    enabled: Boolean(organizationId),
    ...options,
  });
};
