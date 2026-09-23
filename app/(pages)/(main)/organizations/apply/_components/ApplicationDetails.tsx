import { ReactNode, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCheck, TbCopy } from "react-icons/tb";

import type {
  ApplicationStatus,
  IApplication,
} from "@/apis/organization-application/models/application";
import AppImage from "@/components/ui/AppImage";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import {
  CHANNEL_TYPE_OPTIONS,
  DOC_TYPE_OPTIONS,
  ORG_TYPE_OPTIONS,
} from "../_services/application.service";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Waiting for review",
  UNDER_REVIEW: "Under review",
  NEEDS_MORE_INFO: "More information needed",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_TONES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  NEEDS_MORE_INFO: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-zinc-100 text-zinc-700",
};

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-[200px] shrink-0 text-sm text-foreground-tertiary">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm break-words">{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function TrackingCode({ code }: { code: string }) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Could not copy, please copy the code manually"),
      });
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-button-accent-hover bg-background-primary py-1 pl-3 pr-1">
      <span className="text-xs text-foreground-tertiary">
        {t("Tracking code")}
      </span>
      <span className="text-sm font-semibold tracking-wider">{code}</span>
      <button
        type="button"
        onClick={copyCode}
        aria-label={t("Copy")}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-button-accent transition-colors hover:bg-[rgba(136,122,71,0.1)]"
      >
        {isCopied ? <TbCheck className="size-4" /> : <TbCopy className="size-4" />}
        {/* {isCopied ? t("Copied") : t("Copy")} */}
      </button>
    </div>
  );
}

/**
 * Everything an applicant may see about their submission. The legal representative is
 * review-only and never reaches the public endpoints, so it is not shown here. The pages
 * around it supply the card and the actions.
 */
export const ApplicationDetails = memo(function ApplicationDetails({
  application,
}: {
  application: IApplication;
}) {
  const { t } = useTranslation();
  const { profile, channels, documents, status } = application;

  return (
    <div className="flex flex-col gap-6">
      {profile.background_url && (
        <AppImage
          src={profile.background_url}
          alt=""
          className="h-[140px] w-full rounded-[10px] object-cover sm:h-[180px]"
        />
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {profile.logo_url && (
          <AppImage
            src={profile.logo_url}
            alt={profile.name}
            className="size-[72px] shrink-0 rounded-full border border-[rgba(136,122,71,0.35)] bg-white object-cover"
          />
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* h2, not h1: the global `h1` rule in globals.css forces the Playfair title font. */}
            <h2 className="font-display-6 font-semibold !text-button-accent break-words">
              {profile.name}
            </h2>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                STATUS_TONES[status],
              )}
            >
              {t(STATUS_LABELS[status])}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-tertiary">
            <TrackingCode code={application.code} />
            <span>
              {t("Submitted on")} {formattedDate(application.submitted_at, true)}
            </span>
            {application.reviewed_at && (
              <span>
                {t("Reviewed on")} {formattedDate(application.reviewed_at, true)}
              </span>
            )}
          </div>
        </div>
      </header>

      {status === "NEEDS_MORE_INFO" && application.review_note && (
        <section className="rounded-md border border-orange-200 bg-orange-50 p-4">
          <h3 className="font-semibold text-orange-900">
            {t("A reviewer asked for more information")}
          </h3>
          <p className="mt-1 whitespace-pre-line text-sm text-orange-900">
            {application.review_note}
          </p>
        </section>
      )}

      {status === "REJECTED" && application.reject_reason && (
        <section className="rounded-md border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900">
            {t("Why it was not approved")}
          </h3>
          <p className="mt-1 whitespace-pre-line text-sm text-red-900">
            {application.reject_reason}
          </p>
        </section>
      )}

      {status === "APPROVED" && (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-900">
            {t("Your organization has been approved")}
          </h3>
          <p className="mt-1 text-sm text-emerald-900">
            {t(
              "We emailed a link to the contact address so you can set the password of the organization's account.",
            )}
          </p>
        </section>
      )}

      <Section title={t("Organization profile")}>
        <SummaryRow
          label={t("Type of organization")}
          value={t(
            ORG_TYPE_OPTIONS.find((o) => o.value === application.org_type)
              ?.label ?? application.org_type,
          )}
        />
        <SummaryRow label={t("Name")} value={profile.name} />
        <SummaryRow label={t("Contact email")} value={profile.contact_email} />
        <SummaryRow label={t("Address")} value={profile.address ?? ""} />
        <SummaryRow
          label={t("Description")}
          value={
            // Stored as the editor's Slate JSON, so it needs the same renderer as the
            // report detail rather than plain text.
            <RichTextContent
              value={profile.description}
              className="font-display-2 text-foreground-secondary leading-relaxed"
              maxLines={4}
              showMoreLabel={t("Show more")}
              showLessLabel={t("Show less")}
              emptyFallback="—"
            />
          }
        />
      </Section>

      <Section title={t("Channels")}>
        {channels.length ? (
          channels.map((channel) => (
            <SummaryRow
              key={`${channel.type}-${channel.url}`}
              label={t(
                CHANNEL_TYPE_OPTIONS.find((o) => o.value === channel.type)
                  ?.label ?? channel.type,
              )}
              value={
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-button-accent underline-offset-4 hover:underline"
                >
                  {channel.url}
                </a>
              }
            />
          ))
        ) : (
          <p className="text-sm text-foreground-tertiary">
            {t("No channels added.")}
          </p>
        )}
      </Section>

      <Section title={t("Legal documents")}>
        {documents.length ? (
          documents.map((document) => (
            <SummaryRow
              key={document.id}
              label={t(
                DOC_TYPE_OPTIONS.find((o) => o.value === document.doc_type)
                  ?.label ?? document.doc_type,
              )}
              value={document.file_name ?? ""}
            />
          ))
        ) : (
          <p className="text-sm text-foreground-tertiary">
            {t("No documents attached.")}
          </p>
        )}
      </Section>
    </div>
  );
});

export default ApplicationDetails;
