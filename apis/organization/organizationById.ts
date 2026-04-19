import requestApi from "@/utils/requestApi";
import {
  IGetOrganizationByIdResponse,
  IUpdateOrganizationRequest,
  IUpdateOrganizationResponse,
  IVerifyOrganizationResponse,
  IResendContactEmailResponse,
} from "./models/organizationById";
import { ICreateJoinRequestResponse } from "./models/joinRequestById";
import {
  useGet,
  UseGetOptions,
  usePost,
  UsePostOptions,
} from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import { IGetMembersRequest, IGetMembersResponse } from "./models/organizationMembers";

const url = "/organizations";

// GET /api/v1/organizations/{id}
export const getOrganizationById = async (
  id: string,
): Promise<IGetOrganizationByIdResponse> => {
  return await requestApi.get<IGetOrganizationByIdResponse>(`${url}/${id}`);
};

export const useGetOrganizationById = (
  id: string,
  options?: Omit<
    UseGetOptions<IGetOrganizationByIdResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["organization", id],
    queryFn: () => getOrganizationById(id),
    ...options,
  });
};

// PUT /api/v1/organizations/{id}/verify
export const verifyOrganization = async (
  id: string,
): Promise<IVerifyOrganizationResponse> => {
  return await requestApi.put<IVerifyOrganizationResponse>(
    `${url}/${id}/verify`,
    undefined,
  );
};

/** Placeholder until the backend exposes a reject endpoint. */
export async function rejectOrganizationMock(_id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 280));
}

export const useVerifyOrganization = (
  options?: UsePostOptions<IVerifyOrganizationResponse, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: verifyOrganization,
    messageSuccess: {
      content: t("Organization verified successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// PUT /api/v1/organizations/{id}
export const updateOrganization = async ({
  id,
  data,
}: {
  id: string;
  data: IUpdateOrganizationRequest;
}): Promise<IUpdateOrganizationResponse> => {
  return await requestApi.put<IUpdateOrganizationResponse>(
    `${url}/${id}`,
    data,
  );
};

export const useUpdateOrganization = (
  options?: UsePostOptions<
    IUpdateOrganizationResponse,
    { id: string; data: IUpdateOrganizationRequest }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateOrganization,
    messageSuccess: {
      content: t("Organization updated successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// POST /api/v1/organizations/{id}/resend-contact-email
export const resendContactEmail = async (
  id: string,
): Promise<IResendContactEmailResponse> => {
  return await requestApi.post<IResendContactEmailResponse>(
    `${url}/${id}/resend-contact-email`,
    undefined,
  );
};

export const useResendContactEmail = (
  options?: UsePostOptions<IResendContactEmailResponse, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resendContactEmail,
    messageSuccess: {
      content: t("Contact email resent successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// POST /api/v1/organizations/{id}/join-requests
export const createJoinRequest = async (
  id: string,
): Promise<ICreateJoinRequestResponse> => {
  return await requestApi.post<ICreateJoinRequestResponse>(
    `${url}/${id}/join-requests`,
    undefined,
  );
};

export const useCreateJoinRequest = (
  options?: UsePostOptions<ICreateJoinRequestResponse, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createJoinRequest,
    messageSuccess: {
      content: t("Join request sent successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// GET /api/v1/organizations/{id}/members
export const getMembersByOrg = async (
  req: IGetMembersRequest,
): Promise<IGetMembersResponse> => {
  const { organization_id, ...rest } = req;
  return await requestApi.get<IGetMembersResponse>(`${url}/${organization_id}/members`, rest);
};

export const useGetMembersByOrg = (
  req: IGetMembersRequest,
  options?: Omit<
    UseGetOptions<IGetMembersResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: [
      "organization-members",
      req.organization_id,
      req.page ?? 1,
      req.limit ?? 20,
      req.search ?? "",
      req.name ?? "",
      req.sort_by ?? null,
      req.sort_order ?? null,
    ],
    queryFn: () => getMembersByOrg(req),
    ...options,
  });
};