import requestApi from "@/utils/requestApi";
import {
  IGetReportContextRequest,
  IGetReportContextResponse,
} from "./models/context";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports/context";

/** A hint only. The server answers within ~2 s (`suggestTimeoutMs`); 3 s leaves room for the gateway. */
export const getReportContext = async (
  req: IGetReportContextRequest,
): Promise<IGetReportContextResponse> => {
  return await requestApi.get<IGetReportContextResponse>(url, req, {
    timeout: 3000,
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
