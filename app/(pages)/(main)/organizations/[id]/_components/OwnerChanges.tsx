import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbPlus, TbTrash, TbUserShield } from "react-icons/tb";

import {
  useApproveOwnerChange,
  useCancelOwnerChange,
  useCreateOwnerChange,
  useGetOwnerChanges,
  useRejectOwnerChange,
  useResendOwnerChangeInvite,
} from "@/apis/organization/ownerChanges";
import type { IOwnerChange } from "@/apis/organization/models/membership";
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
import TagStatus from "@/components/ui/TagStatus";
import { ORG_ROLE_LABEL } from "@/components/ui/RoleBadge";
import {
  OWNER_APPROVAL_STATUS_TAG,
  OWNER_CANDIDATE_STATUS_TAG,
  OWNER_CHANGE_STATUS_TAG,
  OWNER_CHANGE_TYPE_LABEL,
} from "@/constants/organizationApplicationStatus";
import { ConfirmPopoverModal } from "@/modules/OrganizationCard/components/ConfirmPopoverModal";
import { formattedDate } from "@/utils/formattedDate";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";
import { useInvalidateOwnership } from "../_hooks/useInvalidateOwnership";

const MAX_PROPOSED_OWNERS = 5;
const OPEN_STATUS = "AWAITING_OWNER_CONFIRMATION";

interface ProposalRow {
  person: AutoCompleteUserValue | null;
  fullName: string;
}

const emptyRow = (): ProposalRow => ({ person: null, fullName: "" });

/** What the change does, in one sentence. */
function useDescribeChange() {
  const { t } = useTranslation();
  return (change: IOwnerChange): string => {
    const target = change.target?.name ?? "—";
    const keep = change.demote_to
      ? t("keeps the role {{role}}", { role: t(ORG_ROLE_LABEL[change.demote_to]) })
      : t("leaves the organization");
    if (change.type === "REMOVE_OWNER") {
      // A legal representative is replaced, never just removed.
      const replacement = change.owners.find((o) => o.is_legal_rep);
      if (replacement) {
        return t("Replace legal representative {{from}} with {{to}}", {
          from: target,
          to: replacement.full_name,
        });
      }
      return t("Remove {{name}} as owner ({{keep}})", { name: target, keep });
    }
    return t("Add {{names}} as owner", {
      names: change.owners.map((o) => o.full_name).join(", "),
    });
  };
}

const OpenChangeCard = memo(function OpenChangeCard({ change }: { change: IOwnerChange }) {
  const { t } = useTranslation();
  const { organizationId } = useOrganizationDetail();
  const invalidate = useInvalidateOwnership();
  const describe = useDescribeChange();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  const { mutate: approve, isPending: isApproving } = useApproveOwnerChange({
    onSuccess: invalidate,
  });
  const { mutate: reject, isPending: isRejecting } = useRejectOwnerChange({
    onSuccess: () => {
      setRejectOpen(false);
      setNote("");
      invalidate();
    },
  });
  const { mutate: cancel, isPending: isCancelling } = useCancelOwnerChange();
  const { mutate: resend, isPending: isResending, variables } = useResendOwnerChangeInvite();
  const statusTag = OWNER_CHANGE_STATUS_TAG[change.status];
  const now = Date.now();

  return (
    <div className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {t(OWNER_CHANGE_TYPE_LABEL[change.type] ?? change.type)} · {change.code}
        </span>
        {statusTag && (
          <TagStatus type={statusTag.type} label={t(statusTag.label)} className="!m-0" />
        )}
      </div>
      <p className="text-sm">{describe(change)}</p>
      <p className="text-xs text-foreground-tertiary">
        {t("Proposed by {{name}}", { name: change.proposer.name ?? change.proposer.email })}
        {` · ${formattedDate(change.created_at)}`}
        {change.reason ? ` — “${change.reason}”` : ""}
      </p>

      {change.owners.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground-tertiary">
            {t("Email confirmations")}
          </span>
          <ul className="flex flex-col gap-2">
            {change.owners.map((owner) => {
              const tag = OWNER_CANDIDATE_STATUS_TAG[owner.status];
              const nextAt = owner.next_resend_at ? new Date(owner.next_resend_at) : null;
              const canResend =
                owner.status === "PENDING" && (!nextAt || nextAt.getTime() <= now);
              return (
                <li
                  key={owner.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 break-all">
                    {owner.full_name}{" "}
                    <span className="text-foreground-tertiary">&lt;{owner.email}&gt;</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />
                    {owner.status === "PENDING" && (
                      <button
                        type="button"
                        className="text-xs text-button-accent underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                        disabled={
                          !canResend || (isResending && variables?.candidateId === owner.id)
                        }
                        title={
                          nextAt && !canResend
                            ? t("You can resend at {{time}}", {
                                time: formattedDate(nextAt.toISOString(), true),
                              })
                            : undefined
                        }
                        onClick={() =>
                          resend({
                            organizationId,
                            applicationId: change.id,
                            candidateId: owner.id,
                          })
                        }
                      >
                        {t("Resend")}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {change.approvals.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground-tertiary">
            {t("Other owners' approval")}
          </span>
          <ul className="flex flex-col gap-2">
            {change.approvals.map((approval) => {
              const tag = OWNER_APPROVAL_STATUS_TAG[approval.status];
              return (
                <li
                  key={approval.user_id}
                  className={`flex flex-wrap items-center justify-between gap-2 text-sm ${
                    approval.void ? "opacity-50" : ""
                  }`}
                >
                  <span className="min-w-0 break-all">
                    {approval.name ?? "—"}
                    {approval.note && (
                      <span className="text-foreground-tertiary"> — “{approval.note}”</span>
                    )}
                  </span>
                  {approval.void ? (
                    <span className="text-xs text-foreground-tertiary">
                      {t("No longer an owner")}
                    </span>
                  ) : (
                    tag && <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(change.my_approval === "PENDING" || change.can_cancel) && (
        <div className="flex flex-wrap justify-end gap-2">
          {change.can_cancel && (
            <ConfirmPopoverModal
              title={t("Cancel this proposal?")}
              description={t("Unanswered confirmation links stop working.")}
              confirmLabel={t("Cancel proposal")}
              cancelLabel={t("Keep it")}
              confirmPending={isCancelling}
              onConfirm={() => cancel({ organizationId, applicationId: change.id })}
              trigger={<Button variant="outlined-brown">{t("Cancel proposal")}</Button>}
            />
          )}
          {change.my_approval === "PENDING" && (
            <>
              <Button
                variant="outlined-brown"
                isDisabled={isRejecting || isApproving}
                onClick={() => setRejectOpen(true)}
              >
                {t("Reject")}
              </Button>
              <Button
                variant="brown"
                isDisabled={isRejecting || isApproving}
                onClick={() => approve({ organizationId, applicationId: change.id })}
              >
                {t("Approve")}
              </Button>
            </>
          )}
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Reject this proposal?")}</DialogTitle>
            <DialogDescription>
              {t("One rejection is enough to end the proposal. The proposer will be told.")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("Optional: tell them why")}
            maxLength={1000}
          />
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setRejectOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="brown"
              isDisabled={isRejecting}
              onClick={() =>
                reject({
                  organizationId,
                  applicationId: change.id,
                  note: note.trim() || null,
                })
              }
            >
              {t("Reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

/** Closed owner changes (applied, rejected, cancelled), newest first. Owners only. */
export const OwnerChangeHistory = memo(function OwnerChangeHistory() {
  const { t } = useTranslation();
  const { organizationId, permissions } = useOrganizationDetail();
  const canPropose = Boolean(permissions?.can_propose_owners);
  const describe = useDescribeChange();
  const { data, isLoading } = useGetOwnerChanges(organizationId, {
    enabled: canPropose && Boolean(organizationId),
  });
  if (!canPropose) return null;
  const closed = (data?.data?.changes ?? []).filter((c) => c.status !== OPEN_STATUS);

  if (isLoading) {
    return <p className="text-sm text-foreground-tertiary">{t("Loading...")}</p>;
  }
  if (closed.length === 0) {
    return <p className="text-sm text-foreground-tertiary">{t("No owner changes yet.")}</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-[rgba(136,122,71,0.2)]">
      {closed.map((change) => {
        const tag = OWNER_CHANGE_STATUS_TAG[change.status];
        const note = change.reject_reason ?? change.review_note;
        return (
          <li key={change.id} className="flex flex-col gap-1 py-2 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{describe(change)}</span>
              {tag && <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />}
            </div>
            <span className="text-xs text-foreground-tertiary">
              {t("Proposed by {{name}}", {
                name: change.proposer.name ?? change.proposer.email,
              })}
              {change.reviewed_at ? ` · ${formattedDate(change.reviewed_at)}` : ""}
              {note ? ` — ${note}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
});

/**
 * Open owner changes (each person's and each co-owner's answer). Decided inside the
 * organization — people concerned confirm by email, the other owners approve here.
 */
export const OwnerChangesPanel = memo(function OwnerChangesPanel() {
  const { organizationId, permissions } = useOrganizationDetail();
  const canPropose = Boolean(permissions?.can_propose_owners);

  const { data } = useGetOwnerChanges(organizationId, {
    enabled: canPropose && Boolean(organizationId),
  });
  const changes = data?.data?.changes ?? [];
  const openChanges = changes.filter((c) => c.status === OPEN_STATUS);

  if (!canPropose || openChanges.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(136,122,71,0.25)] pt-4">
      {openChanges.map((change) => (
        <OpenChangeCard key={change.id} change={change} />
      ))}
    </div>
  );
});

/** "Propose new owners" button and its dialog. Hidden while an ADD_OWNER change is open. */
export const ProposeOwnersDialog = memo(function ProposeOwnersDialog() {
  const { t } = useTranslation();
  const { organizationId, permissions } = useOrganizationDetail();
  const canPropose = Boolean(permissions?.can_propose_owners);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ProposalRow[]>([emptyRow()]);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data } = useGetOwnerChanges(organizationId, {
    enabled: canPropose && Boolean(organizationId),
  });
  const addOpen = (data?.data?.changes ?? []).some(
    (c) => c.status === OPEN_STATUS && c.type === "ADD_OWNER",
  );

  const invalidate = useInvalidateOwnership();
  const { mutate: create, isPending: isCreating } = useCreateOwnerChange({
    onSuccess: () => {
      setOpen(false);
      setRows([emptyRow()]);
      setReason("");
      setSubmitted(false);
      invalidate();
    },
  });

  if (!canPropose || addOpen) return null;

  const invalidRows = rows.map((row) => !row.person || !row.fullName.trim());
  const submit = () => {
    setSubmitted(true);
    if (invalidRows.some(Boolean)) return;
    create({
      organizationId,
      type: "ADD_OWNER",
      reason: reason.trim() || null,
      owners: rows.map((row) => ({
        ...(row.person?.userId
          ? { user_id: row.person.userId }
          : { email: row.person!.email }),
        full_name: row.fullName.trim(),
      })),
    });
  };

  return (
    <>
      <Button
        variant="outlined-brown"
        size="medium"
        iconLeft={<TbUserShield className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {t("Propose new owners")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("Propose new owners")}</DialogTitle>
            <DialogDescription>
              {t(
                "Pick existing accounts, or type the email of someone without one. Each person confirms by email and every other owner must approve.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-md border border-[rgba(136,122,71,0.35)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {t("Owner {{number}}", { number: index + 1 })}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      aria-label={t("Remove")}
                      onClick={() => setRows(rows.filter((_, i) => i !== index))}
                      className="rounded-full p-1 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <TbTrash className="size-4" />
                    </button>
                  )}
                </div>
                <AutoCompleteUser
                  organizationId={organizationId}
                  value={row.person}
                  invalid={submitted && !row.person}
                  onChange={(person) =>
                    setRows(
                      rows.map((r, i) =>
                        i === index
                          ? { person, fullName: r.fullName || person?.name || "" }
                          : r,
                      ),
                    )
                  }
                />
                <Input
                  value={row.fullName}
                  placeholder={t("Full name")}
                  aria-invalid={submitted && !row.fullName.trim()}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, i) =>
                        i === index ? { ...r, fullName: e.target.value } : r,
                      ),
                    )
                  }
                />
              </div>
            ))}
            {rows.length < MAX_PROPOSED_OWNERS && (
              <div className="w-full flex flex-row justify-end">
                <Button
                  variant="outlined-brown"
                  iconLeft={<TbPlus className="size-4" />}
                  onClick={() => setRows([...rows, emptyRow()])}
                  className="self-start"
                >
                  {t("Add")}
                </Button>
              </div>
            )}
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("Reason (shown to the other owners)")}
              maxLength={1000}
            />
            {submitted && invalidRows.some(Boolean) && (
              <p className="text-sm text-destructive">
                {t("Pick a person and fill in the full name for every row")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button variant="brown" isDisabled={isCreating} onClick={submit}>
              {t("Send proposal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default OwnerChangesPanel;
