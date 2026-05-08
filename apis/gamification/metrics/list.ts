import requestApi from "@/utils/requestApi";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";
import type {
  IGetMetricColumnsRequest,
  IGetMetricColumnsResponse,
  IGetMetricTablesRequest,
  IGetMetricTablesResponse,
} from "./models";

const metricTablesUrl = "/api/v1/metric-tables";
const metricColumnsUrl = "/api/v1/metric-columns";

export const getMetricTables = async (
  req: IGetMetricTablesRequest = {},
): Promise<IGetMetricTablesResponse> => {
  return await requestApi.get<IGetMetricTablesResponse>(metricTablesUrl, req);
};

export const useGetMetricTables = (
  req: IGetMetricTablesRequest = {},
  options?: Omit<UseGetOptions<IGetMetricTablesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "metric-tables", req],
    queryFn: () => getMetricTables(req),
    ...options,
  });
};

export const getMetricColumns = async (
  req: IGetMetricColumnsRequest = {},
): Promise<IGetMetricColumnsResponse> => {
  return await requestApi.get<IGetMetricColumnsResponse>(metricColumnsUrl, req);
};

export const useGetMetricColumns = (
  req: IGetMetricColumnsRequest = {},
  options?: Omit<UseGetOptions<IGetMetricColumnsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["gamification", "metric-columns", req],
    queryFn: () => getMetricColumns(req),
    ...options,
  });
};
