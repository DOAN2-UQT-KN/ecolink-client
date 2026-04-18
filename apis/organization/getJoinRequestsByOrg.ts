import requestApi from "@/utils/requestApi";
import {
  IGetJoinRequestsByOrgRequest,
  IGetJoinRequestsByOrgResponse,
} from "./models/joinRequestById";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/organizations";

// GET /api/v1/organizations/{id}/join-requests
export const getJoinRequestsByOrg = async (
  id: string,
  req: IGetJoinRequestsByOrgRequest,
): Promise<IGetJoinRequestsByOrgResponse> => {
  return await requestApi.get<IGetJoinRequestsByOrgResponse>(
    `${url}/${id}/join-requests`,
    req,
  );
};

export const useGetJoinRequestsByOrg = (
  id: string,
  req: IGetJoinRequestsByOrgRequest,
  options?: Omit<
    UseGetOptions<IGetJoinRequestsByOrgResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["organization-join-requests", id, req],
    queryFn: () => getJoinRequestsByOrg(id, req),
    ...options,
  });
};
