import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbUserPlus } from "react-icons/tb";

import { useCreateInvitation } from "@/apis/organization/invitations";
import type { IUserSearchResult } from "@/apis/organization/models/membership";
import { Button } from "@/components/client/shared/Button";
import { SelectListUser } from "@/components/form/SelectListUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

/**
 * Any member may invite someone who already has an account, as MEMBER. If the inviter cannot
 * approve members, the invitation waits for an owner or admin before the person is emailed.
 */
export const InviteMemberDialog = memo(function InviteMemberDialog() {
  const { t } = useTranslation();
  const { organizationId, permissions } = useOrganizationDetail();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<IUserSearchResult | null>(null);
  const canApprove = Boolean(permissions?.can_approve_members);

  const { mutate, isPending } = useCreateInvitation({
    onSuccess: (res) => {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title:
          res.data.invitation.status === "SENT"
            ? t("Invitation sent")
            : t("Invitation created. It will be sent once an owner or admin approves it"),
      });
      setOpen(false);
      setPicked(null);
    },
  });

  if (!permissions?.can_invite) return null;

  return (
    <>
      <Button
        variant="outlined-brown"
        size="medium"
        iconLeft={<TbUserPlus className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {t("Invite member")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPicked(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Invite a member")}</DialogTitle>
            <DialogDescription>
              {canApprove
                ? t("The person receives an email and joins once they accept.")
                : t(
                    "An owner or admin must approve your invitation before the person is emailed. They join once they accept.",
                  )}
            </DialogDescription>
          </DialogHeader>
          <SelectListUser
            organizationId={organizationId}
            value={picked}
            onChange={setPicked}
          />
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="brown"
              isDisabled={!picked || isPending}
              onClick={() =>
                picked && mutate({ organizationId, userId: picked.id })
              }
            >
              {canApprove ? t("Send invitation") : t("Request invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default InviteMemberDialog;
