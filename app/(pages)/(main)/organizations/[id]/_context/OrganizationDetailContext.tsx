"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useGetOrganizationById } from "@/apis/organization/organizationById";
import {
  useCancelJoinRequest,
  useCreateOrganizationJoinRequest,
} from "@/apis/organization/joinRequest";
import { useLeaveOrganization } from "@/apis/organization/leaveOrganization";
import type { IOrganization } from "@/apis/organization/models/organization";
import { STATUS } from "@/constants/status";
import { invalidateOrganizationListsQuery } from "@/modules/OrganizationCard/services/invalidateOrganizationLists";
import {
  joinListingShowsCancelButton,
  joinListingShowsJoinButton,
} from "@/modules/OrganizationCard/utils/joinRequestListingUi";
import useAuthStore from "@/stores/useAuthStore";

export interface OrganizationDetailContextType {
  organizationId: string;
  organization: IOrganization | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isLeaveConfirmOpen: boolean;
  setIsLeaveConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showYourGroupTag: boolean;
  showJoinButton: boolean;
  showCancelButton: boolean;
  showLeaveButton: boolean;
  joinRequestId: string | undefined;
  isJoinPending: boolean;
  isCancelPending: boolean;
  isLeavePending: boolean;
  handleJoinClick: () => void;
  handleCancelJoinClick: () => void;
  handleLeaveClick: () => void;
  handleConfirmLeave: () => void;
}

export const OrganizationDetailContext = createContext<
  OrganizationDetailContextType | undefined
>(undefined);

export function OrganizationDetailProvider({
  organizationId,
  children,
}: {
  organizationId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  const invalidateAfterMutation = useCallback(() => {
    invalidateOrganizationListsQuery(queryClient);
    void queryClient.invalidateQueries({
      queryKey: ["organization", organizationId],
    });
  }, [queryClient, organizationId]);

  const { mutate: requestJoin, isPending: isJoinPending } =
    useCreateOrganizationJoinRequest({
      onSettled: invalidateAfterMutation,
    });

  const { mutate: cancelJoin, isPending: isCancelPending } =
    useCancelJoinRequest({
      onSettled: invalidateAfterMutation,
    });

  const { mutate: leaveOrganization, isPending: isLeavePending } =
    useLeaveOrganization({
      onSettled: invalidateAfterMutation,
    });

  const { data, isLoading, isError, isFetching } = useGetOrganizationById(
    organizationId,
    { enabled: Boolean(organizationId) },
  );

  const organization = data?.data?.organization;

  const ownerId = organization?.owner_id;
  const requestStatus = organization?.request_status;
  const joinRequestId = organization?.join_request_id;
  const isMember = Boolean(organization?.is_member);

  const showYourGroupTag =
    ownerId != null &&
    currentUserId != null &&
    ownerId === currentUserId;

  const showJoinButton =
    !showYourGroupTag && !isMember && joinListingShowsJoinButton(requestStatus);
  const showCancelButton = joinListingShowsCancelButton(requestStatus);
  const showLeaveButton = !showYourGroupTag && isMember;

  const handleJoinClick = useCallback(() => {
    if (!organizationId) return;
    requestJoin(organizationId);
  }, [organizationId, requestJoin]);

  const handleCancelJoinClick = useCallback(() => {
    if (!joinRequestId) return;
    cancelJoin({ request_id: joinRequestId });
  }, [joinRequestId, cancelJoin]);

  const handleLeaveClick = useCallback(() => {
    setIsLeaveConfirmOpen((prev) => !prev);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    if (!organizationId) return;
    leaveOrganization({ id: organizationId });
    setIsLeaveConfirmOpen(false);
  }, [organizationId, leaveOrganization]);

  const contextValue = useMemo(
    () => ({
      organizationId,
      organization,
      isLoading,
      isError,
      isFetching,
      isLeaveConfirmOpen,
      setIsLeaveConfirmOpen,
      showYourGroupTag,
      showJoinButton,
      showCancelButton,
      showLeaveButton,
      joinRequestId,
      isJoinPending,
      isCancelPending,
      isLeavePending,
      handleJoinClick,
      handleCancelJoinClick,
      handleLeaveClick,
      handleConfirmLeave,
    }),
    [
      organizationId,
      organization,
      isLoading,
      isError,
      isFetching,
      isLeaveConfirmOpen,
      showYourGroupTag,
      showJoinButton,
      showCancelButton,
      showLeaveButton,
      joinRequestId,
      isJoinPending,
      isCancelPending,
      isLeavePending,
      handleJoinClick,
      handleCancelJoinClick,
      handleLeaveClick,
      handleConfirmLeave,
    ],
  );

  return (
    <OrganizationDetailContext.Provider value={contextValue}>
      {children}
    </OrganizationDetailContext.Provider>
  );
}
