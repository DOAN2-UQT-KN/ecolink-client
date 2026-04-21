import requestApi from "@/utils/requestApi";
import { IGetReportsRequest, IGetReportsResponse } from "./models/getReport";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports/search";
const myReportsurl = "/api/v1/reports/my";

export const getReports = async (
  params: IGetReportsRequest,
): Promise<IGetReportsResponse> => {
  return await requestApi.get<IGetReportsResponse>(url, params);
};

export const getMyReports = async (
  params: IGetReportsRequest,
): Promise<IGetReportsResponse> => {
  return await requestApi.get<IGetReportsResponse>(myReportsUrl, params);
};

export const useGetReports = (
  params: IGetReportsRequest,
  options?: Omit<UseGetOptions<IGetReportsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["reports", params],
    queryFn: () => getReports(params),
    ...options,
  });
};

export const useGetMyReports = (
  params: IGetReportsRequest,
  options?: Omit<UseGetOptions<IGetReportsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["my-reports", params],
    queryFn: () => getMyReports(params),
    ...options,
  });
};
