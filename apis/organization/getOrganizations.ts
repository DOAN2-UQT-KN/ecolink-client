import requestApi from "@/utils/requestApi";
import {
  IGetOrganizationsRequest,
  IGetOrganizationsResponse,
} from "./models/getOrganizations";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/organizations";

export const getOrganizations = async (
  req: IGetOrganizationsRequest,
): Promise<IGetOrganizationsResponse> => {
  return await requestApi.get<IGetOrganizationsResponse>(url, req);
};

export const useGetOrganizations = (
  req: IGetOrganizationsRequest,
  options?: Omit<UseGetOptions<IGetOrganizationsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organizations", req],
    queryFn: () => getOrganizations(req),
    ...options,
  });
};
