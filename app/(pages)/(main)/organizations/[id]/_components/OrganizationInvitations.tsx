import { memo } from "react";
import { useTranslation } from "react-i18next";

import {
  useApproveInvitation,
  useCancelInvitation,
  useGetInvitations,
  useRejectInvitation,
} from "@/apis/organization/invitations";
import type { InvitationStatus } from "@/apis/organization/models/membership";
import { Button } from "@/components/client/shared/Button";
import Image from "@/components/ui/AppImage";
import { Skeleton } from "@/components/ui/skeleton";
import TagStatus from "@/components/ui/TagStatus";
import { STATUS } from "@/constants/status";
import useAuthStore from "@/stores/useAuthStore";
import { formattedDate } from "@/utils/formattedDate";
import defaultAvatar from "@/public/default-avatar.png";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";
import { InviteMemberDialog } from "./InviteMemberDialog";

export const INVITATION_STATUS_TAG: Record<
  InvitationStatus,
  { type: STATUS; label: string }
> = {
  PENDING_APPROVAL: { type: STATUS.WAITING_APPROVED, label: "Waiting for approval" },
  SENT: { type: STATUS.PENDING, label: "Waiting for the invitee" },
  ACCEPTED: { type: STATUS.APPROVED, label: "Accepted" },
  DECLINED: { type: STATUS.REJECTED, label: "Declined" },
  REJECTED: { type: STATUS.REJECTED, label: "Not approved" },
  CANCELLED: { type: STATUS.CANCELED, label: "Cancelled" },
  EXPIRED: { type: STATUS.CANCELED, label: "Expired" },
};

/**
 * Member invitations. Approvers (owners, admins) see every invitation and decide on the ones
 * waiting for approval; other members see the invitations they sent.
 */
export const OrganizationInvitations = memo(function OrganizationInvitations({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const { organizationId, permissions } = useOrganizationDetail();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const canApprove = Boolean(permissions?.can_approve_members);

  const { data, isLoading } = useGetInvitations(organizationId, undefined, {
    enabled: enabled && Boolean(organizationId),
  });
  const { mutate: approve, isPending: isApproving } = useApproveInvitation();
  const { mutate: reject, isPending: isRejecting } = useRejectInvitation();
  const { mutate: cancel, isPending: isCancelling } = useCancelInvitation();

  const invitations = data?.data?.invitations ?? [];
  const busy = isApproving || isRejecting || isCancelling;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground-tertiary">
          {canApprove
            ? t("Invitations from members wait here for your approval.")
            : t("Invitations you sent. An owner or admin approves them before they go out.")}
        </p>
        <InviteMemberDialog />
      </div>

      <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : invitations.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-tertiary">
            {t("No invitations yet.")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {invitations.map((invitation) => {
              const tag = INVITATION_STATUS_TAG[invitation.status];
              const isOpen =
                invitation.status === "PENDING_APPROVAL" ||
                invitation.status === "SENT";
              const canCancel =
                isOpen && (canApprove || invitation.inviter.id === currentUserId);
              const action = { organizationId, invitationId: invitation.id };
              return (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={invitation.invitee.avatar || defaultAvatar}
                      alt={invitation.invitee.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium break-all">
                        {invitation.invitee.name}{" "}
                        <span className="font-normal text-foreground-tertiary">
                          {invitation.invitee.email}
                        </span>
                      </span>
                      <span className="text-xs text-foreground-tertiary">
                        {t("Invited by {{name}}", { name: invitation.inviter.name })}
                        {` · ${formattedDate(invitation.created_at)}`}
                        {invitation.status === "SENT" && invitation.expires_at
                          ? ` · ${t("Expires {{date}}", {
                              date: formattedDate(invitation.expires_at),
                            })}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />
                    {canApprove && invitation.status === "PENDING_APPROVAL" && (
                      <>
                        <Button
                          variant="brown"
                          size="small"
                          isDisabled={busy}
                          onClick={() => approve(action)}
                        >
                          {t("Approve")}
                        </Button>
                        <Button
                          variant="outlined-brown"
                          size="small"
                          isDisabled={busy}
                          onClick={() => reject(action)}
                        >
                          {t("Reject")}
                        </Button>
                      </>
                    )}
                    {canCancel && invitation.status !== "PENDING_APPROVAL" && (
                      <Button
                        variant="outlined-brown"
                        size="small"
                        isDisabled={busy}
                        onClick={() => cancel(action)}
                      >
                        {t("Cancel")}
                      </Button>
                    )}
                    {canCancel &&
                      !canApprove &&
                      invitation.status === "PENDING_APPROVAL" && (
                        <Button
                          variant="outlined-brown"
                          size="small"
                          isDisabled={busy}
                          onClick={() => cancel(action)}
                        >
                          {t("Cancel")}
                        </Button>
                      )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});

export default OrganizationInvitations;
