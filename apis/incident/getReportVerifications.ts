import requestApi from "@/utils/requestApi";
import { IGetReportVerificationsResponse } from "./models/verification";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports";

export const getReportVerifications = async (
  id: string,
): Promise<IGetReportVerificationsResponse> => {
  return await requestApi.get<IGetReportVerificationsResponse>(
    `${url}/${id}/verifications`,
  );
};

export const useGetReportVerifications = (
  id: string,
  options?: Omit<
    UseGetOptions<IGetReportVerificationsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["reports", "verifications", id],
    queryFn: () => getReportVerifications(id),
    ...options,
  });
};
