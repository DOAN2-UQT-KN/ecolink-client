import requestApi from "@/utils/requestApi";
import {
  IVerifyEmailRequest,
  IVerifyEmailResponse,
} from "./models/verifyEmail";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/organizations/verify-contact-email";

export const verifyEmail = async (
  req: IVerifyEmailRequest,
): Promise<IVerifyEmailResponse> => {
  return await requestApi.get<IVerifyEmailResponse>(url, req);
};

export const useVerifyEmail = (
  req: IVerifyEmailRequest,
  options?: Omit<UseGetOptions<IVerifyEmailResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["verify-email", req],
    queryFn: () => verifyEmail(req),
    ...options,
  });
};
