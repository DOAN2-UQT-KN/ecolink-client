import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import { IApplicationResponse } from "./models/application";
import {
  ICreateApplicationRequest,
  IUpdateApplicationRequest,
} from "./models/createApplication";
import { SUBMISSION_TOKEN_HEADER } from "./submissionToken";

const url = "/api/v1/organization-applications";

export interface ICreateApplicationVariables {
  submissionToken: string;
  data: ICreateApplicationRequest;
}

export const createApplication = async ({
  submissionToken,
  data,
}: ICreateApplicationVariables): Promise<IApplicationResponse> => {
  return await requestApi.post<IApplicationResponse>(url, data, {
    headers: { [SUBMISSION_TOKEN_HEADER]: submissionToken },
  });
};

export const useCreateApplication = (
  options?: UsePostOptions<IApplicationResponse, ICreateApplicationVariables>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createApplication,
    messageSuccess: {
      content: t("Application submitted successfully"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const updateApplication = async ({
  id,
  token,
  ...data
}: IUpdateApplicationRequest): Promise<IApplicationResponse> => {
  return await requestApi.put<IApplicationResponse>(
    `${url}/${id}?token=${encodeURIComponent(token)}`,
    data,
  );
};

export const useUpdateApplication = (
  options?: UsePostOptions<IApplicationResponse, IUpdateApplicationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateApplication,
    messageSuccess: {
      content: t("Application updated successfully"),
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
    `${url}/${req.id}/withdraw?token=${encodeURIComponent(req.token)}`,
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
