import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";
import {
  IGetMyOrganizationsRequest,
  IGetMyOrganizationsResponse,
} from "./models/getMyOrganizations";

const url = "/organizations/my";

export const getMyOrganizations = async (
  req: IGetMyOrganizationsRequest,
): Promise<IGetMyOrganizationsResponse> => {
  return await requestApi.get<IGetMyOrganizationsResponse>(url, req);
};

export const useGetMyOrganizations = (
  req: IGetMyOrganizationsRequest,
  options?: Omit<
    UseGetOptions<IGetMyOrganizationsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["my-organizations", req],
    queryFn: () => getMyOrganizations(req),
    ...options,
  });
};
