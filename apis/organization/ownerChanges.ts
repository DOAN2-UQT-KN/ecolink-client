import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  IEmptyResponse,
  IOwnerChangeResponse,
  IOwnerChangesResponse,
  IOwnerProposalInput,
  OwnerDemoteRole,
} from "./models/membership";

const url = "/api/v1/organizations";
const QUERY_KEY = "organization-owner-changes";

export type ICreateOwnerChangeRequest = { organizationId: string; reason?: string | null } & (
  | { type: "ADD_OWNER"; owners: IOwnerProposalInput[] }
  | {
      type: "REMOVE_OWNER";
      target_user_id: string;
      demote_to: OwnerDemoteRole;
      /** Required when the target is the legal representative: who takes the role over. */
      replacement?: IOwnerProposalInput;
    }
);

export const createOwnerChange = async ({
  organizationId,
  ...data
}: ICreateOwnerChangeRequest): Promise<IOwnerChangeResponse> => {
  return await requestApi.post<IOwnerChangeResponse>(
    `${url}/${organizationId}/owner-changes`,
    data,
  );
};

export const useCreateOwnerChange = (
  options?: UsePostOptions<IOwnerChangeResponse, ICreateOwnerChangeRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createOwnerChange,
    queryKey: [QUERY_KEY],
    messageSuccess: { content: t("Proposal sent"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const getOwnerChanges = async (
  organizationId: string,
): Promise<IOwnerChangesResponse> => {
  return await requestApi.get<IOwnerChangesResponse>(
    `${url}/${organizationId}/owner-changes`,
  );
};

export const useGetOwnerChanges = (
  organizationId: string,
  options?: Omit<UseGetOptions<IOwnerChangesResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: [QUERY_KEY, organizationId],
    queryFn: () => getOwnerChanges(organizationId),
    enabled: Boolean(organizationId),
    ...options,
  });
};

type ChangeActionRequest = { organizationId: string; applicationId: string };

const postAction =
  (action: string) =>
  async ({
    organizationId,
    applicationId,
    ...body
  }: ChangeActionRequest & Record<string, unknown>): Promise<IEmptyResponse> =>
    requestApi.post<IEmptyResponse>(
      `${url}/${organizationId}/owner-changes/${applicationId}/${action}`,
      body,
    );

export const approveOwnerChange = postAction("approve");
export const rejectOwnerChange = postAction("reject") as (
  req: ChangeActionRequest & { note?: string | null },
) => Promise<IEmptyResponse>;
export const cancelOwnerChange = postAction("cancel");

export const useApproveOwnerChange = (
  options?: UsePostOptions<IEmptyResponse, ChangeActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: approveOwnerChange,
    queryKey: [QUERY_KEY],
    messageSuccess: { content: t("You approved the proposal"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useRejectOwnerChange = (
  options?: UsePostOptions<IEmptyResponse, ChangeActionRequest & { note?: string | null }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: rejectOwnerChange,
    queryKey: [QUERY_KEY],
    messageSuccess: { content: t("You rejected the proposal"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useCancelOwnerChange = (
  options?: UsePostOptions<IEmptyResponse, ChangeActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: cancelOwnerChange,
    queryKey: [QUERY_KEY],
    messageSuccess: { content: t("Proposal cancelled"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const resendOwnerChangeInvite = async ({
  organizationId,
  applicationId,
  candidateId,
}: ChangeActionRequest & { candidateId: string }): Promise<IEmptyResponse> => {
  return await requestApi.post<IEmptyResponse>(
    `${url}/${organizationId}/owner-changes/${applicationId}/owners/${candidateId}/resend`,
    {},
  );
};

export const useResendOwnerChangeInvite = (
  options?: UsePostOptions<IEmptyResponse, ChangeActionRequest & { candidateId: string }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resendOwnerChangeInvite,
    queryKey: [QUERY_KEY],
    messageSuccess: {
      content: t("Confirmation email sent again"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
