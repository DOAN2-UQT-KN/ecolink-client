import requestApi from "@/utils/requestApi";
import { IGetReportVerificationResponse } from "./models/verification";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports";

export const getReportVerification = async (
  id: string,
): Promise<IGetReportVerificationResponse> => {
  return await requestApi.get<IGetReportVerificationResponse>(
    `${url}/${id}/verification`,
  );
};

export const useGetReportVerification = (
  id: string,
  options?: Omit<
    UseGetOptions<IGetReportVerificationResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["reports", "verification", id],
    queryFn: () => getReportVerification(id),
    retry: false,
    silentError: true,
    ...options,
  });
};

/** `libs/axiosClient` rejects a 404 with the raw AxiosError (no `code`), so read the HTTP status. */
export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; response?: { status?: number } };
  return (e.status ?? e.response?.status) === 404;
}
