import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type {
  IEmptyResponse,
  IOwnerProposalInput,
  IOwnerProposalResponse,
  IOwnerProposalsResponse,
} from "./models/membership";

const url = "/api/v1/organizations";

export interface ICreateOwnerProposalRequest {
  organizationId: string;
  owners: IOwnerProposalInput[];
  reason?: string | null;
}

export const createOwnerProposal = async ({
  organizationId,
  ...data
}: ICreateOwnerProposalRequest): Promise<IOwnerProposalResponse> => {
  return await requestApi.post<IOwnerProposalResponse>(
    `${url}/${organizationId}/owner-proposals`,
    data,
  );
};

export const useCreateOwnerProposal = (
  options?: UsePostOptions<IOwnerProposalResponse, ICreateOwnerProposalRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createOwnerProposal,
    queryKey: ["organization-owner-proposals"],
    messageSuccess: {
      content: t("Proposal sent. Each person will receive a confirmation email"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const getOwnerProposals = async (
  organizationId: string,
): Promise<IOwnerProposalsResponse> => {
  return await requestApi.get<IOwnerProposalsResponse>(
    `${url}/${organizationId}/owner-proposals`,
  );
};

export const useGetOwnerProposals = (
  organizationId: string,
  options?: Omit<UseGetOptions<IOwnerProposalsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-owner-proposals", organizationId],
    queryFn: () => getOwnerProposals(organizationId),
    enabled: Boolean(organizationId),
    ...options,
  });
};

type ProposalActionRequest = { organizationId: string; applicationId: string };

export const cancelOwnerProposal = async ({
  organizationId,
  applicationId,
}: ProposalActionRequest): Promise<IEmptyResponse> => {
  return await requestApi.post<IEmptyResponse>(
    `${url}/${organizationId}/owner-proposals/${applicationId}/cancel`,
    {},
  );
};

export const useCancelOwnerProposal = (
  options?: UsePostOptions<IEmptyResponse, ProposalActionRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: cancelOwnerProposal,
    queryKey: ["organization-owner-proposals"],
    messageSuccess: { content: t("Proposal cancelled"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const resendOwnerProposalInvite = async ({
  organizationId,
  applicationId,
  candidateId,
}: ProposalActionRequest & { candidateId: string }): Promise<IEmptyResponse> => {
  return await requestApi.post<IEmptyResponse>(
    `${url}/${organizationId}/owner-proposals/${applicationId}/owners/${candidateId}/resend`,
    {},
  );
};

export const useResendOwnerProposalInvite = (
  options?: UsePostOptions<
    IEmptyResponse,
    ProposalActionRequest & { candidateId: string }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resendOwnerProposalInvite,
    queryKey: ["organization-owner-proposals"],
    messageSuccess: {
      content: t("Confirmation email sent again"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
