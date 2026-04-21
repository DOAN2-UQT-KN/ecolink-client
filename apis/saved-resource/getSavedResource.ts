import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";
import { IGetResourceRequest, IGetResourceResponse } from "./models/getResource";

const url = "/incident/saved-resources";

export const getSavedResources = async (
  params: IGetResourceRequest,
): Promise<IGetResourceResponse> => {        
  return await requestApi.get<IGetResourceResponse>(url, params);
};

export const useGetSavedResources = (
  params: IGetResourceRequest,
  options?: Omit<UseGetOptions<IGetResourceResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["saved-resources", params],
    queryFn: () => getSavedResources(params),
    ...options,
  });
};
