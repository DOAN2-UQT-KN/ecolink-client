import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";
import {
  IGetUsersRequest,
  IGetUsersResponse,
} from "./models/getUsers";

const url = "/api/v1/users";

export const getUsers = async (
  req: IGetUsersRequest,
): Promise<IGetUsersResponse> => {
  return await requestApi.get<IGetUsersResponse>(url, req);
};

export const useGetUsers = (
  req: IGetUsersRequest,
  options?: Omit<UseGetOptions<IGetUsersResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["users", req],
    queryFn: () => getUsers(req),
    ...options,
  });
};
