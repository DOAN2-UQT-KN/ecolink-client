import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useGetOrganizationBySlug } from "@/apis/organization/organizationBySlug";
import {
  useCancelJoinRequest,
  useCreateOrganizationJoinRequest,
} from "@/apis/organization/joinRequest";
import { useLeaveOrganization } from "@/apis/organization/leaveOrganization";
import {
  isOwnerRole,
  type IOrganization,
  type IOrgPermissions,
  type OrgMemberRole,
} from "@/apis/organization/models/organization";
import { invalidateOrganizationListsQuery } from "@/modules/OrganizationCard/services/invalidateOrganizationLists";
import {
  joinListingShowsCancelButton,
  joinListingShowsJoinButton,
} from "@/modules/OrganizationCard/utils/joinRequestListingUi";

export interface OrganizationDetailContextType {
  organizationSlug: string;
  organizationId: string;
  organization: IOrganization | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  /** The viewer's role here, or null when not a member. */
  myRole: OrgMemberRole | null;
  /** What the viewer may do here (from the server); undefined for anonymous visitors. */
  permissions: IOrgPermissions | undefined;
  /** The viewer holds any role here. */
  showYourGroupTag: boolean;
  canEditOrg: boolean;
  showJoinButton: boolean;
  showCancelButton: boolean;
  showLeaveButton: boolean;
  joinRequestId: string | undefined;
  isJoinPending: boolean;
  isCancelPending: boolean;
  isLeavePending: boolean;
  handleJoinClick: () => void;
  handleCancelJoinClick: () => void;
  handleConfirmLeave: () => void | Promise<void>;
}

export const OrganizationDetailContext = createContext<
  OrganizationDetailContextType | undefined
>(undefined);

export function OrganizationDetailProvider({
  organizationSlug,
  children,
}: {
  organizationSlug: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching } = useGetOrganizationBySlug(
    organizationSlug,
    { enabled: Boolean(organizationSlug) },
  );

  const organization = data?.data?.organization;
  const organizationId = organization?.id ?? "";

  const invalidateAfterMutation = useCallback(() => {
    invalidateOrganizationListsQuery(queryClient);
    void queryClient.invalidateQueries({
      queryKey: ["organization-by-slug", organizationSlug],
    });
    if (organizationId) {
      void queryClient.invalidateQueries({
        queryKey: ["organization", organizationId],
      });
    }
  }, [queryClient, organizationSlug, organizationId]);

  const { mutate: requestJoin, isPending: isJoinPending } =
    useCreateOrganizationJoinRequest({
      onSettled: invalidateAfterMutation,
    });

  const { mutate: cancelJoin, isPending: isCancelPending } =
    useCancelJoinRequest({
      onSettled: invalidateAfterMutation,
    });

  const { mutateAsync: leaveOrganization, isPending: isLeavePending } =
    useLeaveOrganization({
      onSettled: invalidateAfterMutation,
    });

  const requestStatus = organization?.request_status;
  const joinRequestId = organization?.join_request_id;
  const isMember = Boolean(organization?.is_member);

  const myRole = organization?.my_role ?? null;
  const permissions = organization?.permissions;
  const showYourGroupTag = Boolean(myRole);
  const canEditOrg = Boolean(permissions?.can_edit_org);

  const showJoinButton =
    !showYourGroupTag && !isMember && joinListingShowsJoinButton(requestStatus);
  const showCancelButton = joinListingShowsCancelButton(requestStatus);
  // Owners cannot leave yet (revoking or transferring ownership is phase 3).
  const showLeaveButton = Boolean(myRole) && !isOwnerRole(myRole);

  const handleJoinClick = useCallback(() => {
    if (!organizationId) return;
    requestJoin(organizationId);
  }, [organizationId, requestJoin]);

  const handleCancelJoinClick = useCallback(() => {
    if (!joinRequestId) return;
    cancelJoin({ request_id: joinRequestId });
  }, [joinRequestId, cancelJoin]);

  const handleConfirmLeave = useCallback(async () => {
    if (!organizationId) return;
    await leaveOrganization({ id: organizationId });
  }, [organizationId, leaveOrganization]);

  const contextValue = useMemo(
    () => ({
      organizationSlug,
      organizationId,
      organization,
      isLoading,
      isError,
      isFetching,
      myRole,
      permissions,
      showYourGroupTag,
      canEditOrg,
      showJoinButton,
      showCancelButton,
      showLeaveButton,
      joinRequestId,
      isJoinPending,
      isCancelPending,
      isLeavePending,
      handleJoinClick,
      handleCancelJoinClick,
      handleConfirmLeave,
    }),
    [
      organizationSlug,
      organizationId,
      organization,
      isLoading,
      isError,
      isFetching,
      myRole,
      permissions,
      showYourGroupTag,
      canEditOrg,
      showJoinButton,
      showCancelButton,
      showLeaveButton,
      joinRequestId,
      isJoinPending,
      isCancelPending,
      isLeavePending,
      handleJoinClick,
      handleCancelJoinClick,
      handleConfirmLeave,
    ],
  );

  return (
    <OrganizationDetailContext.Provider value={contextValue}>
      {children}
    </OrganizationDetailContext.Provider>
  );
}
