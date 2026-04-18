import { getReports } from "@/apis/incident/getReport";
import type { IGetReportsRequest, IGetReportsResponse } from "@/apis/incident/models/getReport";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

export const useGetIncidents = (
  req: IGetReportsRequest,
  options?: Omit<UseGetOptions<IGetReportsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["incidents", req],
    queryFn: () => getReports(req),
    ...options,
  });
};
