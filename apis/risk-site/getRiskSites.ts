import requestApi from "@/utils/requestApi";
import type {
  IGetRiskSitesRequest,
  IGetRiskSitesResponse,
} from "@/apis/risk-site/models/riskSite";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/admin/risk-sites";

export const getRiskSites = async (
  req: IGetRiskSitesRequest,
): Promise<IGetRiskSitesResponse> => {
  return await requestApi.get<IGetRiskSitesResponse>(url, req);
};

export const useGetRiskSites = (
  req: IGetRiskSitesRequest,
  options?: Omit<UseGetOptions<IGetRiskSitesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["risk-sites", req],
    queryFn: () => getRiskSites(req),
    ...options,
  });
};
