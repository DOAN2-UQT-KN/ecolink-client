import requestApi from "@/utils/requestApi";
import { IGetReportDetailResponse } from "./models/getReportDetail";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports";

export const getReportDetail = async (
  id: string,
): Promise<IGetReportDetailResponse> => {
  return await requestApi.get<IGetReportDetailResponse>(`${url}/${id}`);
};

export const useGetReportDetail = (
  id: string,
  options?: Omit<
    UseGetOptions<IGetReportDetailResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["report-detail", id],
    queryFn: () => getReportDetail(id),
    ...options,
  });
};
