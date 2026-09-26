import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TbAlertTriangle, TbCircleCheck, TbCircleX } from "react-icons/tb";

import {
  useConfirmOwner,
  useDeclineOwner,
  useGetOwnerConfirmation,
} from "@/apis/organization-application/ownerConfirmation";
import type { IOwnerConfirmation } from "@/apis/organization-application/models/ownerConfirmation";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import AppImage from "@/components/ui/AppImage";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "@/libs/router";
import { formattedDate } from "@/utils/formattedDate";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../apply/_components/ApplicationPageLayout";
import { SummaryRow } from "../apply/_components/ApplicationDetails";
import { ORG_TYPE_OPTIONS } from "../apply/_services/application.service";

// `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Owner confirmation", path: "/organizations/owner-confirm", type: "page" },
];

function Outcome({
  tone,
  title,
  message,
}: {
  tone: "success" | "neutral" | "warning";
  title: string;
  message: string;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-[rgba(136,122,71,0.35)] bg-[rgba(136,122,71,0.06)] text-foreground-secondary",
    warning: "border-orange-200 bg-orange-50 text-orange-900",
  }[tone];
  const Icon = tone === "success" ? TbCircleCheck : tone === "warning" ? TbAlertTriangle : TbCircleX;
  return (
    <section className={`flex gap-3 rounded-md border p-4 ${styles}`}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </section>
  );
}

/** What the person is being asked to agree to: the organization and everyone on it. */
function ConfirmationSummary({ confirmation }: { confirmation: IOwnerConfirmation }) {
  const { t } = useTranslation();
  const { organization, candidate } = confirmation;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-4">
        {organization.logo_url && (
          <AppImage
            src={organization.logo_url}
            alt={organization.name ?? ""}
            className="size-[64px] shrink-0 rounded-full border border-[rgba(136,122,71,0.35)] bg-white object-cover"
          />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display-6 font-semibold !text-button-accent break-words">
            {organization.name}
          </h2>
          <span className="text-sm text-foreground-tertiary">
            {t("Application")} {confirmation.application_code}
          </span>
        </div>
      </header>

      <p className="text-sm">
        {candidate.is_legal_rep
          ? t(
              "{{submitter}} listed you ({{email}}) as an owner and the legal representative of this organization.",
              { submitter: confirmation.submitter_email, email: candidate.email },
            )
          : t(
              "{{submitter}} listed you ({{email}}) as an owner of this organization.",
              { submitter: confirmation.submitter_email, email: candidate.email },
            )}
      </p>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <SummaryRow
          label={t("Type of organization")}
          value={t(
            ORG_TYPE_OPTIONS.find((o) => o.value === organization.org_type)?.label ??
              organization.org_type ??
              "",
          )}
        />
        <SummaryRow label={t("Address")} value={organization.address ?? ""} />
        <SummaryRow label={t("Submitted by")} value={confirmation.submitter_email} />
        <SummaryRow
          label={t("Your role")}
          value={candidate.is_legal_rep ? t("Owner, legal representative") : t("Owner")}
        />
        <SummaryRow
          label={t("Other owners")}
          value={
            confirmation.other_owners.length ? (
              <ul className="flex flex-col gap-1">
                {confirmation.other_owners.map((owner) => (
                  <li key={owner.email}>
                    {owner.full_name}{" "}
                    <span className="text-foreground-tertiary">&lt;{owner.email}&gt;</span>
                    {owner.is_legal_rep && (
                      <span className="text-foreground-tertiary">
                        {" "}
                        · {t("Legal representative")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              t("Nobody else")
            )
          }
        />
      </section>
    </div>
  );
}

/**
 * Public page behind the link in the owner-confirmation email. There is no login: owning the
 * mailbox is the proof of consent. A signed-in visitor using a different account is warned so
 * nobody confirms on someone else's behalf by accident.
 */
export default function OwnerConfirmPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [blockFuture, setBlockFuture] = useState(false);

  const { data, isLoading, isError, refetch } = useGetOwnerConfirmation(token);
  const confirmation = data?.data?.confirmation;

  const { mutate: confirm, isPending: isConfirming } = useConfirmOwner({
    onSettled: () => void refetch(),
  });
  const { mutate: decline, isPending: isDeclining } = useDeclineOwner({
    onSuccess: () => setDeclineOpen(false),
    onSettled: () => void refetch(),
  });

  if (!token || isError) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationNotFound message={t("This confirmation link is invalid.")} />
      </ApplicationPageLayout>
    );
  }

  if (isLoading || !confirmation) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationDetailsSkeleton />
      </ApplicationPageLayout>
    );
  }

  const { status, active, expired } = confirmation;
  const canAnswer = active && status === "PENDING" && !expired;

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <ConfirmationSummary confirmation={confirmation} />

      {confirmation.session_email_mismatch && canAnswer && (
        <Outcome
          tone="warning"
          title={t("You are signed in with a different account")}
          message={t(
            "This invitation was sent to {{email}}. Only confirm if that mailbox is yours.",
            { email: confirmation.candidate.email },
          )}
        />
      )}

      {status === "CONFIRMED" && (
        <Outcome
          tone="success"
          title={t("You confirmed")}
          message={t(
            "Thank you. The application goes to review once every owner has confirmed; you will get an email when it is decided.",
          )}
        />
      )}
      {status === "DECLINED" && (
        <Outcome
          tone="neutral"
          title={t("You declined")}
          message={t("You will not be given any role in this organization.")}
        />
      )}
      {status !== "CONFIRMED" && status !== "DECLINED" && !active && (
        <Outcome
          tone="neutral"
          title={t("This application is no longer active")}
          message={t(
            "It was withdrawn or already decided, so there is nothing to confirm.",
          )}
        />
      )}
      {active && status !== "CONFIRMED" && status !== "DECLINED" && expired && (
        <Outcome
          tone="warning"
          title={t("This link has expired")}
          message={t("Ask the person who submitted the application to send you a new one.")}
        />
      )}

      {canAnswer && (
        <div className="flex flex-col gap-3 border-t border-[rgba(136,122,71,0.3)] pt-6">
          {confirmation.expires_at && (
            <p className="text-sm text-foreground-tertiary">
              {t("Please answer before {{date}}.", {
                date: formattedDate(confirmation.expires_at, true),
              })}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outlined-brown"
              onClick={() => setDeclineOpen(true)}
              isDisabled={isConfirming || isDeclining}
              className="w-full sm:w-auto"
            >
              {t("I'm not involved")}
            </Button>
            <Button
              variant="brown"
              onClick={() => confirm({ token })}
              isDisabled={isConfirming || isDeclining}
              className="w-full sm:w-auto"
            >
              {isConfirming ? t("Confirming...") : t("Confirm")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Not involved with this organization?")}</DialogTitle>
            <DialogDescription>
              {t(
                "The application goes back to the person who submitted it. You will not be given any role.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("Optional: tell them why")}
              maxLength={1000}
            />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={blockFuture}
                onCheckedChange={(checked) => setBlockFuture(checked === true)}
              />
              <span>{t("Block my email from all future owner invitations")}</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setDeclineOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="brown"
              isDisabled={isDeclining}
              onClick={() =>
                decline({ token, reason: reason.trim() || null, block_future: blockFuture })
              }
            >
              {t("I'm not involved")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ApplicationPageLayout>
  );
}
