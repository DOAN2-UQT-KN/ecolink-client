import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  IAcceptInvitationResponse,
  IEmptyResponse,
  IInvitationResponse,
  IInvitationSummaryResponse,
  IInvitationsResponse,
  InvitationStatus,
} from "./models/membership";

const url = "/api/v1/organizations";
const publicUrl = "/api/v1/organization-invitations";

export const createInvitation = async (req: {
  organizationId: string;
  userId: string;
}): Promise<IInvitationResponse> => {
  return await requestApi.post<IInvitationResponse>(
    `${url}/${req.organizationId}/invitations`,
    { user_id: req.userId },
  );
};

export const useCreateInvitation = (
  options?: UsePostOptions<IInvitationResponse, { organizationId: string; userId: string }>,
) => {
  return usePost({
    mutationFn: createInvitation,
    queryKey: ["organization-invitations"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const getInvitations = async (
  organizationId: string,
  status?: InvitationStatus,
): Promise<IInvitationsResponse> => {
  return await requestApi.get<IInvitationsResponse>(
    `${url}/${organizationId}/invitations`,
    status ? { status } : undefined,
  );
};

export const useGetInvitations = (
  organizationId: string,
  status?: InvitationStatus,
  options?: Omit<UseGetOptions<IInvitationsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-invitations", organizationId, status ?? "all"],
    queryFn: () => getInvitations(organizationId, status),
    enabled: Boolean(organizationId),
    ...options,
  });
};

type InvitationActionRequest = { organizationId: string; invitationId: string };

export const approveInvitation = async ({
  organizationId,
  invitationId,
}: InvitationActionRequest): Promise<IInvitationResponse> => {
  return await requestApi.put<IInvitationResponse>(
    `${url}/${organizationId}/invitations/${invitationId}/approve`,
    {},
  );
};

export const useApproveInvitation = (
  options?: UsePostOptions<IInvitationResponse, InvitationActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: approveInvitation,
    queryKey: ["organization-invitations"],
    messageSuccess: {
      content: t("Invitation approved and sent"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const rejectInvitation = async ({
  organizationId,
  invitationId,
}: InvitationActionRequest): Promise<IInvitationResponse> => {
  return await requestApi.put<IInvitationResponse>(
    `${url}/${organizationId}/invitations/${invitationId}/reject`,
    {},
  );
};

export const useRejectInvitation = (
  options?: UsePostOptions<IInvitationResponse, InvitationActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: rejectInvitation,
    queryKey: ["organization-invitations"],
    messageSuccess: { content: t("Invitation rejected"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const cancelInvitation = async ({
  organizationId,
  invitationId,
}: InvitationActionRequest): Promise<IEmptyResponse> => {
  return await requestApi.delete<IEmptyResponse>(
    `${url}/${organizationId}/invitations/${invitationId}`,
  );
};

export const useCancelInvitation = (
  options?: UsePostOptions<IEmptyResponse, InvitationActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: cancelInvitation,
    queryKey: ["organization-invitations"],
    messageSuccess: { content: t("Invitation cancelled"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

/** Public: the token from the invitation email is the only credential. */
export const getInvitationByToken = async (
  token: string,
): Promise<IInvitationSummaryResponse> => {
  return await requestApi.get<IInvitationSummaryResponse>(
    `${publicUrl}/${encodeURIComponent(token)}`,
  );
};

export const useGetInvitationByToken = (
  token: string,
  options?: Omit<UseGetOptions<IInvitationSummaryResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-invitation", token],
    queryFn: () => getInvitationByToken(token),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const acceptInvitation = async (req: {
  token: string;
}): Promise<IAcceptInvitationResponse> => {
  return await requestApi.post<IAcceptInvitationResponse>(
    `${publicUrl}/${encodeURIComponent(req.token)}/accept`,
    {},
  );
};

export const useAcceptInvitation = (
  options?: UsePostOptions<IAcceptInvitationResponse, { token: string }>,
) => {
  return usePost({
    mutationFn: acceptInvitation,
    queryKey: ["organization-invitation"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const declineInvitation = async (req: {
  token: string;
}): Promise<IEmptyResponse> => {
  return await requestApi.post<IEmptyResponse>(
    `${publicUrl}/${encodeURIComponent(req.token)}/decline`,
    {},
  );
};

export const useDeclineInvitation = (
  options?: UsePostOptions<IEmptyResponse, { token: string }>,
) => {
  return usePost({
    mutationFn: declineInvitation,
    queryKey: ["organization-invitation"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
