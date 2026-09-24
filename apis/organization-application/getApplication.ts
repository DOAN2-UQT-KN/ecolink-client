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

/**
 * Opens one attached document from the tracking link. The API streams the private file
 * inline, so the browser can preview it in a new tab; the token is the only credential.
 */
export const buildApplicantDocumentUrl = (
  applicationId: string,
  documentId: string,
  trackingToken: string,
): string => {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${url}/${applicationId}/documents/${documentId}/file?token=${encodeURIComponent(
    trackingToken,
  )}`;
};
