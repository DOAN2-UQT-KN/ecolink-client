import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import { IAdminApplicationResponse } from "./models/application";
import {
  IApplicationDecisionRequest,
  IGetAdminApplicationsRequest,
  IGetAdminApplicationsResponse,
  IRequestMoreInfoRequest,
} from "./models/adminApplications";

const url = "/api/v1/admin/organization-applications";

export const getAdminApplications = async (
  req: IGetAdminApplicationsRequest,
): Promise<IGetAdminApplicationsResponse> => {
  return await requestApi.get<IGetAdminApplicationsResponse>(url, req);
};

export const useGetAdminApplications = (
  req: IGetAdminApplicationsRequest,
  options?: Omit<
    UseGetOptions<IGetAdminApplicationsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["organization-applications", req],
    queryFn: () => getAdminApplications(req),
    ...options,
  });
};

export const getAdminApplicationById = async (
  id: string,
): Promise<IAdminApplicationResponse> => {
  return await requestApi.get<IAdminApplicationResponse>(`${url}/${id}`);
};

export const useGetAdminApplicationById = (
  id: string,
  options?: Omit<UseGetOptions<IAdminApplicationResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-application-admin", id],
    queryFn: () => getAdminApplicationById(id),
    enabled: Boolean(id),
    ...options,
  });
};

/**
 * Fetches one stored document as a blob. The API streams the file itself — there is no
 * provider URL to link to — and records every view in the application's audit trail.
 *
 * It has to go through `requestApi`: a plain `<a href>` opens a tab that carries no
 * `Authorization` header (the token lives in the client, not in a cookie), so the admin
 * endpoint answers TOKEN_MISSING.
 */
export const fetchApplicationDocument = async (
  applicationId: string,
  documentId: string,
): Promise<Blob> => {
  return await requestApi.get<Blob>(
    `${url}/${applicationId}/documents/${documentId}/file`,
    undefined,
    { responseType: "blob" },
  );
};

export const claimApplication = async (req: {
  id: string;
}): Promise<IAdminApplicationResponse> => {
  return await requestApi.put<IAdminApplicationResponse>(
    `${url}/${req.id}/claim`,
    {},
  );
};

export const useClaimApplication = (
  options?: UsePostOptions<IAdminApplicationResponse, { id: string }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: claimApplication,
    messageSuccess: {
      content: t("Application claimed"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const requestMoreInfo = async ({
  id,
  ...rest
}: IRequestMoreInfoRequest): Promise<IAdminApplicationResponse> => {
  return await requestApi.put<IAdminApplicationResponse>(
    `${url}/${id}/request-info`,
    rest,
  );
};

export const useRequestMoreInfo = (
  options?: UsePostOptions<IAdminApplicationResponse, IRequestMoreInfoRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: requestMoreInfo,
    messageSuccess: {
      content: t("Requested more information from the applicant"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const decideApplication = async ({
  id,
  ...rest
}: IApplicationDecisionRequest): Promise<IAdminApplicationResponse> => {
  return await requestApi.put<IAdminApplicationResponse>(
    `${url}/${id}/decision`,
    rest,
  );
};

export const useDecideApplication = (
  options?: UsePostOptions<
    IAdminApplicationResponse,
    IApplicationDecisionRequest
  >,
) => {
  return usePost({
    mutationFn: decideApplication,
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
