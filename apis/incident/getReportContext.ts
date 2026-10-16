import requestApi from "@/utils/requestApi";
import {
  IGetReportContextRequest,
  IGetReportContextResponse,
} from "./models/context";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports/context";

/** A hint only: the form drops it after 2 s instead of waiting. */
export const getReportContext = async (
  req: IGetReportContextRequest,
): Promise<IGetReportContextResponse> => {
  return await requestApi.get<IGetReportContextResponse>(url, req, {
    timeout: 2000,
  });
};

export const useGetReportContext = (
  req: IGetReportContextRequest | null,
  options?: Omit<
    UseGetOptions<IGetReportContextResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["reports", "context", req?.lat, req?.lng],
    queryFn: () => getReportContext(req as IGetReportContextRequest),
    enabled: !!req,
    retry: false,
    staleTime: 10 * 60 * 1000,
    silentError: true,
    ...options,
  });
};
