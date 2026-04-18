import requestApi from "@/utils/requestApi";
import { IGetOwnedOrganizationsResponse } from "./models/getOwnedOrganizations";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/organizations/owned";

export const getOwnedOrganizations =
  async (): Promise<IGetOwnedOrganizationsResponse> => {
    return await requestApi.get<IGetOwnedOrganizationsResponse>(url);
  };

export const useGetOwnedOrganizations = (
  options?: Omit<
    UseGetOptions<IGetOwnedOrganizationsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["owned-organizations"],
    queryFn: () => getOwnedOrganizations(),
    ...options,
  });
};
