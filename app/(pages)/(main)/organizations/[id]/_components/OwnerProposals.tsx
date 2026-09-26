import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCircleCheck, TbCircleX, TbPlus, TbTrash, TbUserShield } from "react-icons/tb";

import {
  useCancelOwnerProposal,
  useCreateOwnerProposal,
  useGetOwnerProposals,
  useResendOwnerProposalInvite,
} from "@/apis/organization/ownerProposals";
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
import {
  APPLICATION_STATUS_TAG,
  OWNER_CANDIDATE_STATUS_TAG,
} from "@/constants/organizationApplicationStatus";
import type { ApplicationStatus } from "@/apis/organization-application/models/application";
import { ConfirmPopoverModal } from "@/modules/OrganizationCard/components/ConfirmPopoverModal";
import { formattedDate } from "@/utils/formattedDate";
import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

const MAX_PROPOSED_OWNERS = 5;
const OPEN_STATUSES = ["AWAITING_OWNER_CONFIRMATION", "PENDING_REVIEW"];

interface ProposalRow {
  person: AutoCompleteUserValue | null;
  fullName: string;
}

const emptyRow = (): ProposalRow => ({ person: null, fullName: "" });

/**
 * Owners propose new owners (ADD_OWNER). Each proposed person confirms by email, then a
 * platform admin reviews; an account for someone without one is created only on approval.
 * Only one proposal can be open at a time.
 */
export const OwnerProposals = memo(function OwnerProposals() {
  const { t } = useTranslation();
  const { organizationId, permissions } = useOrganizationDetail();
  const canPropose = Boolean(permissions?.can_propose_owners);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ProposalRow[]>([emptyRow()]);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data } = useGetOwnerProposals(organizationId, {
    enabled: canPropose && Boolean(organizationId),
  });
  const proposals = data?.data?.proposals ?? [];
  const openProposal = proposals.find((p) => OPEN_STATUSES.includes(p.status));
  const lastClosed = proposals.find((p) => !OPEN_STATUSES.includes(p.status));

  const { mutate: create, isPending: isCreating } = useCreateOwnerProposal({
    onSuccess: () => {
      setOpen(false);
      setRows([emptyRow()]);
      setReason("");
      setSubmitted(false);
    },
  });
  const { mutate: cancel, isPending: isCancelling } = useCancelOwnerProposal();
  const { mutate: resend, isPending: isResending, variables } =
    useResendOwnerProposalInvite();

  if (!canPropose) return null;

  const invalidRows = rows.map((row) => !row.person || !row.fullName.trim());
  const submit = () => {
    setSubmitted(true);
    if (invalidRows.some(Boolean)) return;
    create({
      organizationId,
      reason: reason.trim() || null,
      owners: rows.map((row) => ({
        ...(row.person?.userId
          ? { user_id: row.person.userId }
          : { email: row.person!.email }),
        full_name: row.fullName.trim(),
      })),
    });
  };
  const now = Date.now();

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(136,122,71,0.25)] pt-4">
      {openProposal ? (
        <div className="flex flex-col gap-2 rounded-md border border-[rgba(136,122,71,0.35)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              {t("Owner proposal")} {openProposal.code}
            </span>
            <div className="flex items-center gap-2">
              <TagStatus
                type={APPLICATION_STATUS_TAG[openProposal.status as ApplicationStatus]?.type}
                label={t(
                  APPLICATION_STATUS_TAG[openProposal.status as ApplicationStatus]?.label ??
                    openProposal.status,
                )}
                className="!m-0"
              />
              <ConfirmPopoverModal
                title={t("Cancel this proposal?")}
                description={t("Unanswered confirmation links stop working.")}
                confirmLabel={t("Cancel")}
                cancelLabel={t("Keep it")}
                confirmPending={isCancelling}
                onConfirm={() =>
                  cancel({ organizationId, applicationId: openProposal.id })
                }
                trigger={
                  <Button variant="outlined-brown">
                    {t("Cancel")}
                  </Button>
                }
              />
            </div>
          </div>
          {openProposal.status === "PENDING_REVIEW" && (
            <p className="text-xs text-foreground-tertiary">
              {t("Everyone confirmed. A platform admin is reviewing the proposal.")}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {openProposal.owners.map((owner) => {
              const tag = OWNER_CANDIDATE_STATUS_TAG[owner.status];
              const nextAt = owner.next_resend_at ? new Date(owner.next_resend_at) : null;
              const canResend =
                openProposal.status === "AWAITING_OWNER_CONFIRMATION" &&
                owner.status === "PENDING" &&
                (!nextAt || nextAt.getTime() <= now);
              return (
                <li
                  key={owner.id}
                  className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 break-all">
                    {owner.full_name}{" "}
                    <span className="text-foreground-tertiary">&lt;{owner.email}&gt;</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {owner.status === "CONFIRMED" ? (
                      <TbCircleCheck
                        className="size-5 shrink-0 text-emerald-600"
                        aria-label={t(tag.label)}
                        title={t(tag.label)}
                      />
                    ) : (
                      <TbCircleX
                        className="size-5 shrink-0 text-red-500"
                        aria-label={t(tag.label)}
                        title={t(tag.label)}
                      />
                    )}
                    {owner.status === "PENDING" && (
                      <button
                        type="button"
                        className="text-[10px] text-button-accent underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                        disabled={
                          !canResend ||
                          (isResending && variables?.candidateId === owner.id)
                        }
                        onClick={() =>
                          resend({
                            organizationId,
                            applicationId: openProposal.id,
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
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            variant="outlined-brown"
            size="medium"
            iconLeft={<TbUserShield className="size-4" />}
            onClick={() => setOpen(true)}
            className="self-start"
          >
            {t("Propose new owners")}
          </Button>
          {lastClosed && (
            <p className="text-xs text-foreground-tertiary">
              {t("Last proposal {{code}}: {{status}}", {
                code: lastClosed.code,
                status: t(
                  APPLICATION_STATUS_TAG[lastClosed.status as ApplicationStatus]?.label ??
                    lastClosed.status,
                ),
              })}
              {lastClosed.review_note || lastClosed.reject_reason
                ? ` — ${lastClosed.reject_reason ?? lastClosed.review_note}`
                : ""}
              {lastClosed.reviewed_at ? ` · ${formattedDate(lastClosed.reviewed_at)}` : ""}
            </p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("Propose new owners")}</DialogTitle>
            <DialogDescription>
              {t(
                "Pick existing accounts, or type the email of someone without one. Each person confirms by email, then a platform admin reviews the proposal.",
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
              placeholder={t("Reason (shown to the reviewer)")}
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
    </div>
  );
});

export default OwnerProposals;
