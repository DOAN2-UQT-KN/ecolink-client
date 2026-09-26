import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type { OrgMemberRole } from "./models/organization";
import type {
  IChangeMemberRoleResponse,
  IEmptyResponse,
  IUserSearchResponse,
} from "./models/membership";

const url = "/api/v1/organizations";

export interface IChangeMemberRoleRequest {
  organizationId: string;
  userId: string;
  role: OrgMemberRole;
}

export const changeMemberRole = async ({
  organizationId,
  userId,
  role,
}: IChangeMemberRoleRequest): Promise<IChangeMemberRoleResponse> => {
  return await requestApi.patch<IChangeMemberRoleResponse>(
    `${url}/${organizationId}/members/${userId}/role`,
    { role },
  );
};

export const useChangeMemberRole = (
  options?: UsePostOptions<IChangeMemberRoleResponse, IChangeMemberRoleRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: changeMemberRole,
    queryKey: ["organization-members"],
    messageSuccess: { content: t("Role updated"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export interface IRemoveMemberRequest {
  organizationId: string;
  userId: string;
}

export const removeMember = async ({
  organizationId,
  userId,
}: IRemoveMemberRequest): Promise<IEmptyResponse> => {
  return await requestApi.delete<IEmptyResponse>(
    `${url}/${organizationId}/members/${userId}`,
  );
};

export const useRemoveMember = (
  options?: UsePostOptions<IEmptyResponse, IRemoveMemberRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: removeMember,
    queryKey: ["organization-members"],
    messageSuccess: { content: t("Member removed"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

/** People to invite or to propose as owners, scoped to one organization. */
export const searchOrganizationUsers = async (
  organizationId: string,
  q: string,
): Promise<IUserSearchResponse> => {
  return await requestApi.get<IUserSearchResponse>(
    `${url}/${organizationId}/user-search`,
    { q },
  );
};

export const useSearchOrganizationUsers = (
  organizationId: string,
  q: string,
  options?: Omit<UseGetOptions<IUserSearchResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["organization-user-search", organizationId, q],
    queryFn: () => searchOrganizationUsers(organizationId, q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    staleTime: 30_000,
    ...options,
  });
};
