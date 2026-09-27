import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbHelpCircle, TbUserMinus } from "react-icons/tb";

import { useStepDown } from "@/apis/organization/memberManagement";
import type { IOrganizationOwner } from "@/apis/organization/models/organization";
import { useCreateOwnerChange } from "@/apis/organization/ownerChanges";
import { Button } from "@/components/client/shared/Button";
import {
  AutoCompleteUser,
  type AutoCompleteUserValue,
} from "@/components/form/AutoCompleteUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";
import { useInvalidateOwnership } from "../_hooks/useInvalidateOwnership";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

/**
 * One "remove" icon per row of the owners card, for viewers who are owners themselves.
 * On another owner's row it proposes their removal; on one's own row it steps down. Either
 * way the owner ends up a MEMBER of the organization. The legal representative is never
 * just removed: someone must be named to take the role over.
 */
export const OwnerActions = memo(function OwnerActions({
  owner,
  ownerCount,
  isSelf,
}: {
  owner: IOrganizationOwner;
  ownerCount: number;
  isSelf: boolean;
}) {
  const { t } = useTranslation();
  const { permissions } = useOrganizationDetail();
  const [open, setOpen] = useState(false);
  if (!permissions?.can_propose_owners) return null;

  const isLegalRep = owner.role === "LEGAL_REPRESENTATIVE";
  // The last owner cannot step down — unless they are the legal representative handing the
  // role to someone else, which keeps an owner in place.
  const isLastOwner = ownerCount <= 1 && !isLegalRep;
  const tooltip = isLastOwner
    ? t("You are the only owner. Add another owner first.")
    : t("Remove");

  return (
    <div className="flex items-center sm:ml-auto">
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A disabled button fires no hover events; the span keeps the tooltip working. */}
          <span tabIndex={isLastOwner ? 0 : -1}>
            <button
              type="button"
              aria-label={tooltip}
              disabled={isLastOwner}
              onClick={() => setOpen(true)}
              className={cn(
                "flex size-9 items-center cursor-pointer justify-center rounded-md border border-[rgba(136,122,71,0.45)] text-button-accent transition-colors",
                isLastOwner
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-red-50 hover:text-red-700 hover:border-red-200",
              )}
            >
              <TbUserMinus className="size-5" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>

      {isLegalRep ? (
        <ReplaceLegalRepDialog
          owner={owner}
          isSelf={isSelf}
          open={open}
          onOpenChange={setOpen}
        />
      ) : isSelf ? (
        <StepDownDialog open={open} onOpenChange={setOpen} />
      ) : (
        <RemoveOwnerDialog
          owner={owner}
          ownerCount={ownerCount}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  );
});

interface DialogState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Own row: stop being an owner right away and stay as a member. */
const StepDownDialog = memo(function StepDownDialog({ open, onOpenChange }: DialogState) {
  const { t } = useTranslation();
  const { organizationId } = useOrganizationDetail();
  const invalidate = useInvalidateOwnership();
  const { mutate: stepDown, isPending } = useStepDown({
    onSuccess: () => {
      onOpenChange(false);
      invalidate();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Step down as owner?")}</DialogTitle>
          <DialogDescription>
            {t(
              "You become a member of the organization. This takes effect immediately; your open proposals are cancelled.",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outlined-brown" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button
            variant="brown"
            isDisabled={isPending}
            onClick={() => stepDown({ organizationId, role: "MEMBER" })}
          >
            {t("Step down")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

/** Another owner's row: propose making them a member; the other owners must agree. */
const RemoveOwnerDialog = memo(function RemoveOwnerDialog({
  owner,
  ownerCount,
  open,
  onOpenChange,
}: DialogState & { owner: IOrganizationOwner; ownerCount: number }) {
  const { t } = useTranslation();
  const { organizationId } = useOrganizationDetail();
  const invalidate = useInvalidateOwnership();
  const [reason, setReason] = useState("");
  const { mutate: create, isPending } = useCreateOwnerChange({
    onSuccess: () => {
      onOpenChange(false);
      setReason("");
      invalidate();
    },
  });
  // Everyone but the proposer and the person removed.
  const approvers = Math.max(0, ownerCount - 2);
  const name = owner.name || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Remove {{name}} as owner?", { name })}</DialogTitle>
          <DialogDescription>
            {t("{{name}} becomes a member of the organization.", { name })}{" "}
            {approvers === 0
              ? t("There is no other owner to ask: this takes effect immediately.")
              : t("It takes effect once the {{count}} other owner(s) agree.", {
                  count: approvers,
                })}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("Reason (shown to the other owners)")}
          maxLength={1000}
        />
        <DialogFooter>
          <Button variant="outlined-brown" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button
            variant="brown"
            isDisabled={isPending}
            onClick={() =>
              create({
                organizationId,
                type: "REMOVE_OWNER",
                target_user_id: owner.id,
                demote_to: "MEMBER",
                reason: reason.trim() || null,
              })
            }
          >
            {approvers === 0 ? t("Remove owner") : t("Send proposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Legal representative's row (someone else's, or one's own): name who takes the role over.
 * The replacement confirms by email and the other owners approve; then they become the
 * legal representative and the current one a member.
 */
const ReplaceLegalRepDialog = memo(function ReplaceLegalRepDialog({
  owner,
  isSelf,
  open,
  onOpenChange,
}: DialogState & { owner: IOrganizationOwner; isSelf: boolean }) {
  const { t } = useTranslation();
  const { organizationId, organization } = useOrganizationDetail();
  const invalidate = useInvalidateOwnership();
  const [person, setPerson] = useState<AutoCompleteUserValue | null>(null);
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reset = () => {
    setPerson(null);
    setFullName("");
    setReason("");
    setSubmitted(false);
  };
  const { mutate: create, isPending } = useCreateOwnerChange({
    onSuccess: () => {
      onOpenChange(false);
      reset();
      invalidate();
    },
  });
  const name = owner.name || "—";
  const ownerIds = (organization?.owners ?? []).map((o) => o.id);
  const pickedOwner = Boolean(person?.userId && ownerIds.includes(person.userId));
  const pickedTarget = Boolean(person?.userId && person.userId === owner.id);
  const invalid = !person || !fullName.trim() || pickedTarget;

  const submit = () => {
    setSubmitted(true);
    if (invalid || !person) return;
    create({
      organizationId,
      type: "REMOVE_OWNER",
      target_user_id: owner.id,
      demote_to: "MEMBER",
      replacement: {
        ...(person.userId ? { user_id: person.userId } : { email: person.email }),
        full_name: fullName.trim(),
      },
      reason: reason.trim() || null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSelf
              ? t("Step down as legal representative?")
              : t("Replace legal representative {{name}}?", { name })}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t("How does this work?")}
                  className="text-foreground-tertiary hover:text-button-accent cursor-help"
                >
                  <TbHelpCircle className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  {t(
                    "The organization must keep a legal representative. Pick who takes the role over: an owner, a member or anyone by email.",
                  )}{" "}
                  {t(
                    "The replacement confirms by email and the other owners must agree; then they become the legal representative and {{name}} a member.",
                    { name: isSelf ? t("you") : name },
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
          <DialogDescription>{t("Pick who takes the role over.")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <AutoCompleteUser
            organizationId={organizationId}
            value={person}
            invalid={submitted && (!person || pickedTarget)}
            // Current owners may take the role over; only the person being replaced may not.
            isUserDisabled={(user) => user.id === owner.id}
            onChange={(next) => {
              setPerson(next);
              setFullName((current) => current || next?.name || "");
            }}
          />
          {pickedOwner && !pickedTarget && (
            <p className="text-xs text-foreground-tertiary">
              {t("Already an owner: their role changes to legal representative.")}
            </p>
          )}
          {pickedTarget && (
            <p className="text-sm text-destructive">
              {t("Pick someone other than the current legal representative.")}
            </p>
          )}
          <Input
            value={fullName}
            placeholder={t("Full name")}
            aria-invalid={submitted && !fullName.trim()}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("Reason (shown to the other owners)")}
            maxLength={1000}
          />
          {submitted && (!person || !fullName.trim()) && (
            <p className="text-sm text-destructive">
              {t("Pick a replacement and fill in their full name")}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outlined-brown" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button variant="brown" isDisabled={isPending} onClick={submit}>
            {t("Send proposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default OwnerActions;
