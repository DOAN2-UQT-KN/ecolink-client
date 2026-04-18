import requestApi from "@/utils/requestApi";
import {
  IGetMembersRequest,
  IGetMembersResponse,
} from "./models/organizationMembers";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/organizations";

// GET /api/v1/organizations/{id}/members
export const getMembersByOrg = async (
  id: string,
  req: IGetMembersRequest,
): Promise<IGetMembersResponse> => {
  return await requestApi.get<IGetMembersResponse>(
    `${url}/${id}/members`,
    req,
  );
};

export const useGetMembersByOrg = (
  id: string,
  req: IGetMembersRequest,
  options?: Omit<UseGetOptions<IGetMembersResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-members", id, req],
    queryFn: () => getMembersByOrg(id, req),
    ...options,
  });
};
