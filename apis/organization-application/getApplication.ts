import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";
import { IApplicationResponse } from "./models/application";

const url = "/api/v1/organization-applications";

export interface IGetApplicationRequest {
  id: string;
  /** Token from the tracking link that was emailed to the applicant. */
  token: string;
}

export const getApplication = async (
  req: IGetApplicationRequest,
): Promise<IApplicationResponse> => {
  return await requestApi.get<IApplicationResponse>(`${url}/${req.id}`, {
    token: req.token,
  });
};

export const useGetApplication = (
  req: IGetApplicationRequest,
  options?: Omit<UseGetOptions<IApplicationResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-application", req.id, req.token],
    queryFn: () => getApplication(req),
    enabled: Boolean(req.id && req.token),
    ...options,
  });
};
