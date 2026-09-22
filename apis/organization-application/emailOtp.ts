import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import {
  IRequestApplicationOtpRequest,
  IRequestApplicationOtpResponse,
  IVerifyApplicationOtpRequest,
  IVerifyApplicationOtpResponse,
} from "./models/emailOtp";

const url = "/api/v1/organization-applications/email-otp";

export const requestApplicationOtp = async (
  req: IRequestApplicationOtpRequest,
): Promise<IRequestApplicationOtpResponse> => {
  return await requestApi.post<IRequestApplicationOtpResponse>(url, req);
};

export const useRequestApplicationOtp = (
  options?: UsePostOptions<
    IRequestApplicationOtpResponse,
    IRequestApplicationOtpRequest
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: requestApplicationOtp,
    messageSuccess: {
      content: t("Verification code sent"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const verifyApplicationOtp = async (
  req: IVerifyApplicationOtpRequest,
): Promise<IVerifyApplicationOtpResponse> => {
  return await requestApi.post<IVerifyApplicationOtpResponse>(
    `${url}/verify`,
    req,
  );
};

export const useVerifyApplicationOtp = (
  options?: UsePostOptions<
    IVerifyApplicationOtpResponse,
    IVerifyApplicationOtpRequest
  >,
) => {
  return usePost({
    mutationFn: verifyApplicationOtp,
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
