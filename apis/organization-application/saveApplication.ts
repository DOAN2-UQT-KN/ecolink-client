import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import {
  IApplicationResponse,
  ISaveApplicationResponse,
} from "./models/application";
import {
  IResendOwnerInviteRequest,
  ISaveApplicationRequest,
  ISubmitApplicationRequest,
} from "./models/saveApplication";

const url = "/api/v1/organization-applications";

const withToken = (path: string, token: string) =>
  `${path}?token=${encodeURIComponent(token)}`;

/** Saves the draft (DRAFT or NEEDS_REVISION). Full validation only happens on submit. */
export const saveApplication = async ({
  id,
  token,
  ...data
}: ISaveApplicationRequest): Promise<ISaveApplicationResponse> => {
  return await requestApi.put<ISaveApplicationResponse>(
    withToken(`${url}/${id}`, token),
    data,
  );
};

export const useSaveApplication = (
  options?: UsePostOptions<ISaveApplicationResponse, ISaveApplicationRequest>,
) => {
  return usePost({
    mutationFn: saveApplication,
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

/** Validates everything and mails each owner a confirmation link. */
export const submitApplication = async ({
  id,
  token,
  ...data
}: ISubmitApplicationRequest): Promise<IApplicationResponse> => {
  return await requestApi.post<IApplicationResponse>(
    withToken(`${url}/${id}/submit`, token),
    data,
  );
};

export const useSubmitApplication = (
  options?: UsePostOptions<IApplicationResponse, ISubmitApplicationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: submitApplication,
    messageSuccess: {
      content: t("Application submitted successfully"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

/** New confirmation link for one owner who has not answered (max 3, an hour apart). */
export const resendOwnerInvite = async ({
  id,
  token,
  candidateId,
}: IResendOwnerInviteRequest): Promise<IApplicationResponse> => {
  return await requestApi.post<IApplicationResponse>(
    withToken(`${url}/${id}/owners/${candidateId}/resend`, token),
    {},
  );
};

export const useResendOwnerInvite = (
  options?: UsePostOptions<IApplicationResponse, IResendOwnerInviteRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resendOwnerInvite,
    messageSuccess: {
      content: t("Confirmation email sent again"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const withdrawApplication = async (req: {
  id: string;
  token: string;
}): Promise<IApplicationResponse> => {
  return await requestApi.post<IApplicationResponse>(
    withToken(`${url}/${req.id}/withdraw`, req.token),
    {},
  );
};

export const useWithdrawApplication = (
  options?: UsePostOptions<IApplicationResponse, { id: string; token: string }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: withdrawApplication,
    messageSuccess: {
      content: t("Application withdrawn"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
