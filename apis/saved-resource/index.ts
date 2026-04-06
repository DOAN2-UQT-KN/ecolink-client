import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import {
  ISaveResourceRequest,
  ISaveResourceResponse,
} from "./models/saved-resource";

const saveUrl = "/incidents/saved-resources/save";

export const postSaveResource = async (
  data: ISaveResourceRequest,
): Promise<ISaveResourceResponse> => {
  return await requestApi.post<ISaveResourceResponse>(saveUrl, data);
};

export const useSaveResource = (
  options?: UsePostOptions<ISaveResourceResponse, ISaveResourceRequest>,
) => {
  return usePost({
    mutationFn: (data: ISaveResourceRequest) => postSaveResource(data),
    ...options,
  });
};
