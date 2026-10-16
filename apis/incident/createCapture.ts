import requestApi from "@/utils/requestApi";
import { ICreateCaptureResponse } from "./models/capture";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";

const url = "/api/v1/reports/captures";

export const createCapture = async (): Promise<ICreateCaptureResponse> => {
  return await requestApi.post<ICreateCaptureResponse>(url, {});
};

/** Silent by default: a failed capture only downgrades the photo to a library photo. */
export const useCreateCapture = (
  options?: UsePostOptions<ICreateCaptureResponse, void>,
) => {
  return usePost({
    mutationFn: createCapture,
    silentError: true,
    ...options,
  });
};
