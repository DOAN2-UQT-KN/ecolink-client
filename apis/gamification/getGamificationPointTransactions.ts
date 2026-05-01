import requestApi from "@/utils/requestApi";
import type {
  IGetGamificationPointTransactionsRequest,
  IGetGamificationPointTransactionsResponse,
} from "@/apis/gamification/models/gamificationPointLedger";
import { useGet, type UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/me/gamification/point-transactions";

export const getGamificationPointTransactions = async (
  req: IGetGamificationPointTransactionsRequest,
): Promise<IGetGamificationPointTransactionsResponse> => {
  return await requestApi.get<IGetGamificationPointTransactionsResponse>(
    url,
    req,
  );
};

export const useGetGamificationPointTransactions = (
  req: IGetGamificationPointTransactionsRequest,
  options?: Omit<
    UseGetOptions<IGetGamificationPointTransactionsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["gamification", "point-transactions", req],
    queryFn: () => getGamificationPointTransactions(req),
    ...options,
  });
};
