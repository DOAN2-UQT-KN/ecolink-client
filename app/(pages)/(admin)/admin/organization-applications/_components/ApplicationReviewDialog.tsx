import { ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TbChevronDown,
  TbCircleCheck,
  TbCircleX,
  TbExternalLink,
  TbHelpCircle,
  TbInfoCircle,
  TbMessageQuestion,
  TbAlertTriangle,
} from "react-icons/tb";

import {
  fetchApplicationDocument,
  useClaimApplication,
  useDecideApplication,
  useGetAdminApplicationById,
  useRequestMoreInfo,
} from "@/apis/organization-application/adminApplications";
import type {
  ApplicationLane,
  IAdminOwnerCandidate,
} from "@/apis/organization-application/models/application";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Skeleton } from "@/components/ui/skeleton";
import TagStatus from "@/components/ui/TagStatus";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  APPLICATION_STATUS_TAG,
  OWNER_CANDIDATE_STATUS_TAG,
} from "@/constants/organizationApplicationStatus";
import { ApplicationActivity } from "./ApplicationActivity";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { formattedDate } from "@/utils/formattedDate";

type Decision = "APPROVE" | "REJECT" | "REQUEST_INFO";

const OTHER_REASON = "Other";

/**
 * Preset gaps a reviewer usually sends back. Untranslated English here; the message is built
 * from the reviewer's translated labels so it reads naturally in their language.
 */
const REQUEST_INFO_REASONS = [
  "Missing establishment decision or business licence",
  "Documents are unreadable, cropped or expired",
  "Representative ID does not match the provided name",
  "Contact email domain does not match the organization",
  "Official channel link is missing or does not work",
  "Organization name or logo needs to be corrected",
  OTHER_REASON,
];

/** Colour per outcome: filled when picked, tinted outline otherwise. */
const DECISION_STYLES: Record<
  Decision,
  { selected: string; light: string; dark: string }
> = {
  APPROVE: {
    selected: "border-emerald-600 bg-emerald-600 text-white",
    light: "border-emerald-600/40 text-emerald-700 hover:bg-emerald-50",
    dark: "border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10",
  },
  REQUEST_INFO: {
    selected: "border-amber-500 bg-amber-500 text-white",
    light: "border-amber-500/50 text-amber-700 hover:bg-amber-50",
    dark: "border-amber-400/40 text-amber-300 hover:bg-amber-500/10",
  },
  REJECT: {
    selected: "border-red-600 bg-red-600 text-white",
    light: "border-red-600/40 text-red-700 hover:bg-red-50",
    dark: "border-red-400/40 text-red-300 hover:bg-red-500/10",
  },
};

/** The shared checkbox is tinted with the client's green; admin keeps to its zinc palette. */
const adminCheckboxClassName = (isDark: boolean) =>
  isDark
    ? "border-zinc-600 data-checked:border-zinc-100 data-checked:bg-zinc-100 data-checked:text-zinc-900 dark:data-checked:bg-zinc-100"
    : "border-zinc-400 data-checked:border-zinc-900 data-checked:bg-zinc-900 data-checked:text-white";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-[180px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1 break-words text-sm">{value || "—"}</div>
    </div>
  );
}

/** identity-service `users.status`. */
const ACCOUNT_STATUS_LABEL: Record<number, string> = {
  1: "Active",
  2: "Suspended",
  3: "Not activated",
};

/**
 * One owner as the reviewer sees them: the person, not just the paperwork. The two signals
 * worth a look are how close they are to the 3-organization cap, and confirmations from the
 * same IP within minutes (people registering together — or one person filling in for all).
 */
function OwnerRow({ owner }: { owner: IAdminOwnerCandidate }) {
  const { t } = useTranslation();
  const tag = OWNER_CANDIDATE_STATUS_TAG[owner.status];
  return (
    <div className="flex flex-col gap-1.5 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium break-words">
            {owner.full_name}{" "}
            <span className="font-normal text-muted-foreground">&lt;{owner.email}&gt;</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {owner.is_legal_rep ? t("Legal representative") : t("Owner")}
            {owner.is_submitter && ` · ${t("Submitter")}`}
          </p>
        </div>
        <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />
      </div>
      <Row
        label={t("Confirmed at")}
        value={
          owner.responded_at
            ? `${formattedDate(owner.responded_at, true)}${owner.confirm_ip ? ` · ${owner.confirm_ip}` : ""}`
            : ""
        }
      />
      <Row
        label={t("Ecolink account")}
        value={
          owner.account
            ? `${t(ACCOUNT_STATUS_LABEL[owner.account.status] ?? "Unknown")} · ${t("since")} ${formattedDate(owner.account.created_at)}`
            : t("No account yet")
        }
      />
      <Row
        label={t("Organizations owned")}
        value={
          <span
            className={cn(
              "tabular-nums",
              owner.active_owner_org_count >= 2 && "font-semibold text-orange-600",
            )}
          >
            {owner.active_owner_org_count} / 3
          </span>
        }
      />
      {owner.same_ip_cluster && (
        <p className="flex items-start gap-1.5 text-xs text-orange-600">
          <TbAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t(
            "Another owner confirmed from the same IP within 5 minutes. Not a reason to reject on its own, but worth a request for more information if anything else looks off.",
          )}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  hint,
  defaultOpen = false,
  isDark,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "group/section rounded-lg border",
        isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
      )}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 text-left",
          isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50",
        )}
      >
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold">{title}</span>
          {hint && (
            <span className="truncate text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
        <TbChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/section:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The review surface. Everything a reviewer needs to decide is on one screen, and the three
 * possible outcomes share it so nobody has to hunt for "request more information" — that is
 * the state most club applications will pass through.
 */
export function ApplicationReviewDialog({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const { data, isLoading } = useGetAdminApplicationById(applicationId);
  const application = data?.data?.application;

  const [decision, setDecision] = useState<Decision>("APPROVE");
  const [lane, setLane] = useState<ApplicationLane>("B");
  const [waiveDocuments, setWaiveDocuments] = useState(false);
  const [waiveReason, setWaiveReason] = useState("");
  const [grantBlueTick, setGrantBlueTick] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [infoReasons, setInfoReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["organization-applications"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["organization-application-admin", applicationId],
    });
  }, [applicationId]);

  const { mutateAsync: claimAsync, isPending: isClaiming } =
    useClaimApplication({ onSuccess: invalidate });
  const { mutateAsync: requestInfoAsync, isPending: isRequestingInfo } =
    useRequestMoreInfo({ onSuccess: invalidate });
  const { mutateAsync: decideAsync, isPending: isDeciding } =
    useDecideApplication({ onSuccess: invalidate });

  const contactEmailParts = useMemo(() => {
    const [local, domain] = (
      application?.contact_email ??
      application?.submitter_email ??
      ""
    ).split("@");
    return { local, domain };
  }, [application?.contact_email, application?.submitter_email]);

  const isClosed =
    application?.status === "APPROVED" ||
    application?.status === "REJECTED" ||
    application?.status === "WITHDRAWN";
  // Sent back to the applicant: nothing to decide until they resubmit and every owner
  // confirms again.
  const isWithApplicant = application?.status === "NEEDS_REVISION";

  const isOtherPicked = infoReasons.includes(OTHER_REASON);

  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null,
  );
  const openDocument = useCallback(
    async (documentId: string) => {
      if (!application) return;
      // Open the tab now, inside the click, so pop-up blockers allow it; the file arrives
      // after an authenticated fetch and is then loaded into that tab.
      const tab = window.open("", "_blank");
      setOpeningDocumentId(documentId);
      try {
        const blob = await fetchApplicationDocument(application.id, documentId);
        const objectUrl = URL.createObjectURL(blob);
        if (tab) {
          tab.opener = null;
          tab.location.href = objectUrl;
        } else {
          window.open(objectUrl, "_blank", "noopener,noreferrer");
        }
        // The tab has its own copy once loaded; free ours after a while.
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } catch (error) {
        console.error("Could not open the document:", error);
        tab?.close();
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Could not open the document, please try again"),
        });
      } finally {
        setOpeningDocumentId(null);
      }
    },
    [application, t],
  );

  const toggleInfoReason = useCallback((reason: string, checked: boolean) => {
    setInfoReasons((current) =>
      checked
        ? [...current, reason]
        : current.filter((item) => item !== reason),
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!application) return;

    if (decision === "REQUEST_INFO") {
      if (isOtherPicked && !otherReason.trim()) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Enter the other reason"),
        });
        return;
      }
      // Keep the preset order rather than the click order, so notes read consistently.
      const message = [
        ...REQUEST_INFO_REASONS.filter(
          (reason) => reason !== OTHER_REASON && infoReasons.includes(reason),
        ).map((reason) => t(reason)),
        ...(isOtherPicked ? [otherReason.trim()] : []),
      ].join(", ");
      if (!message) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Describe what is missing"),
        });
        return;
      }
      await requestInfoAsync({ id: application.id, message });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("Requested more information from the applicant"),
      });
      onClose();
      return;
    }

    if (decision === "REJECT") {
      if (!rejectReason.trim()) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("A reason is required when rejecting"),
        });
        return;
      }
      await decideAsync({
        id: application.id,
        decision: "REJECT",
        reject_reason: rejectReason.trim(),
      });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("Application rejected"),
      });
      onClose();
      return;
    }

    if (waiveDocuments && !waiveReason.trim()) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("A reason is required when waiving the document requirement"),
      });
      return;
    }

    await decideAsync({
      id: application.id,
      decision: "APPROVE",
      lane,
      documents_waived: waiveDocuments,
      documents_waived_reason: waiveDocuments ? waiveReason.trim() : null,
      grant_blue_tick: grantBlueTick,
    });
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Success,
      title: t("Application approved"),
    });
    onClose();
  }, [
    application,
    decideAsync,
    decision,
    grantBlueTick,
    infoReasons,
    isOtherPicked,
    lane,
    onClose,
    otherReason,
    rejectReason,
    requestInfoAsync,
    t,
    waiveDocuments,
    waiveReason,
  ]);

  const handleLaneChange = useCallback((next: ApplicationLane) => {
    setLane(next);
    // Lane A earns the tick on approval; lane B has to build a track record first. The
    // reviewer can still override either way.
    setGrantBlueTick(next === "A");
    setWaiveDocuments(next === "A");
  }, []);

  const textareaClassName = cn(
    isDark &&
      "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500",
  );
  const checkboxClassName = adminCheckboxClassName(isDark);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-4xl overflow-y-auto",
          isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(isDark ? "text-zinc-100" : "text-zinc-900")}
          >
            {t("Review application")}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !application ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">
                {application.profile?.name}
              </span>
              <TagStatus
                type={APPLICATION_STATUS_TAG[application.status].type}
                label={t(APPLICATION_STATUS_TAG[application.status].label)}
                className="!mx-0 min-w-0 justify-center"
                />
              <span className="text-xs text-muted-foreground">
                {application.code}
              </span>
            </div>

            <Tabs defaultValue="information" className="gap-4 text-xs">
              <TabsList
                className={cn(
                  "h-10 border",
                  isDark ? "border-zinc-700 bg-zinc-800" : "border-border bg-card",
                )}
              >
                <TabsTrigger value="information">{t("Information")}</TabsTrigger>
                <TabsTrigger value="activity">
                  {t("Activity")}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      isDark ? "bg-zinc-700 text-zinc-200" : "bg-zinc-100 text-zinc-600",
                    )}
                  >
                    {application.events?.length ?? 0}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="flex flex-col gap-3">
                {/* The contact domain decides lane A, so it leads. */}
                <SectionCard
                  title={t("Contact email")}
                  defaultOpen
                  isDark={isDark}
                >
                  <p className="text-lg">
                    <span className="text-muted-foreground">
                      {contactEmailParts.local}@
                    </span>
                    <span className="font-semibold">
                      {contactEmailParts.domain}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {application.contact_email &&
                    application.contact_email !== application.submitter_email
                      ? t(
                          "Not verified: the one-time code was sent to the submitter ({{email}}), not to this address.",
                          { email: application.submitter_email },
                        )
                      : t(
                          "Ownership of this mailbox was confirmed by a one-time code before the application was submitted.",
                        )}
                  </p>
                </SectionCard>

                <SectionCard
                  title={t("Organization profile")}
                  defaultOpen
                  isDark={isDark}
                >
                  <Row label={t("Name")} value={application.profile?.name} />
                  <Row
                    label={t("Type")}
                    value={application.org_type ? t(application.org_type) : ""}
                  />
                  <Row label={t("Address")} value={application.profile?.address} />
                  <Row
                    label={t("Description")}
                    value={
                      <RichTextContent
                        value={application.profile?.description}
                        className="text-sm leading-relaxed"
                        maxLines={4}
                        showMoreLabel={t("Show more")}
                        showLessLabel={t("Show less")}
                        emptyFallback="—"
                      />
                    }
                  />
                  <Row label={t("Tracking code")} value={application.code} />
                  <Row
                    label={t("Submitted")}
                    value={
                      application.submitted_at
                        ? formattedDate(application.submitted_at)
                        : ""
                    }
                  />
                </SectionCard>

                <SectionCard
                  title={t("Official channels")}
                  hint={t("{{count}} provided", {
                    count: application.channels?.length ?? 0,
                  })}
                  isDark={isDark}
                >
                  {application.channels?.length ? (
                    application.channels.map((channel) => (
                      <Row
                        key={`${channel.type}-${channel.url}`}
                        label={t(channel.type)}
                        value={
                          <a
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "inline-flex items-center gap-1 underline",
                              isDark ? "text-blue-300" : "text-blue-600",
                            )}
                          >
                            {channel.url}
                            <TbExternalLink />
                          </a>
                        }
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("No channels provided.")}
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  title={t("Owners")}
                  hint={t(
                    "Every owner confirmed by email before this application reached the queue.",
                  )}
                  defaultOpen
                  isDark={isDark}
                >
                  {application.owners?.map((owner) => (
                    <OwnerRow key={owner.id} owner={owner} />
                  ))}
                </SectionCard>

                <SectionCard
                  title={t("Legal representative")}
                  hint={t(
                    "Review-only. Never shown publicly, and only the last 4 characters of the ID number are stored.",
                  )}
                  isDark={isDark}
                >
                  <Row
                    label={t("Full name")}
                    value={application.legal_representative?.full_name}
                  />
                  <Row
                    label={t("Email")}
                    value={application.legal_representative?.email}
                  />
                  <Row
                    label={t("ID number")}
                    value={
                      application.legal_representative?.id_last4
                        ? `${application.legal_representative.id_type} •••• ${application.legal_representative.id_last4}`
                        : ""
                    }
                  />
                  <Row
                    label={t("Phone")}
                    value={application.legal_representative?.phone}
                  />
                  <Row
                    label={t("Position")}
                    value={application.legal_representative?.position}
                  />
                </SectionCard>

                <SectionCard
                  title={t("Legal documents")}
                  hint={t("{{count}} attached", {
                    count: application.documents?.length ?? 0,
                  })}
                  isDark={isDark}
                >
                  {application.documents?.length ? (
                    <ul className="flex flex-col gap-2">
                      {application.documents.map((document) => (
                        <li key={document.id}>
                          <button
                            type="button"
                            onClick={() => openDocument(document.id)}
                            disabled={openingDocumentId === document.id}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-2 text-left text-sm underline disabled:cursor-wait disabled:opacity-60",
                              isDark ? "text-blue-300" : "text-blue-600",
                            )}
                          >
                            <FileTypeIcon
                              mimeType={document.mime_type}
                              fileName={document.file_name}
                              className="size-4"
                            />
                            {document.file_name ?? document.doc_type}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("No documents attached.")}
                    </p>
                  )}
                
                </SectionCard>

                {isClosed || isWithApplicant ? (
                  <section
                    className={cn(
                      "rounded-lg p-4 text-sm",
                      isDark ? "bg-zinc-800" : "bg-zinc-100",
                    )}
                  >
                    {isWithApplicant
                      ? t(
                          "Sent back to the applicant. It returns to the queue once they resubmit and every owner confirms again.",
                        )
                      : t("This application has already been decided.")}
                  </section>
                ) : (
                  <section
                    className={cn(
                      "flex flex-col gap-4 rounded-lg border p-4",
                      isDark
                        ? "border-zinc-700 bg-zinc-800/50"
                        : "border-zinc-200 bg-white",
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{t("Decision")}</h3>
                        {!application.claimed_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isClaiming}
                            onClick={() => claimAsync({ id: application.id })}
                          >
                            {t("Claim for review")}
                          </Button>
                        )}
                      </div>
                      {!application.claimed_at && (
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <TbInfoCircle className="mt-0.5 size-3.5 shrink-0" />
                          {t(
                            "Claiming marks you as the reviewer, so other admins know it is taken and cannot claim it at the same time. It is optional — you can decide without claiming.",
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["APPROVE", t("Approve"), TbCircleCheck],
                          [
                            "REQUEST_INFO",
                            t("Request more information"),
                            TbMessageQuestion,
                          ],
                          ["REJECT", t("Reject"), TbCircleX],
                        ] as const
                      ).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDecision(value)}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                            decision === value
                              ? DECISION_STYLES[value].selected
                              : isDark
                                ? DECISION_STYLES[value].dark
                                : DECISION_STYLES[value].light,
                          )}
                        >
                          <Icon className="size-4" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {decision === "APPROVE" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              [
                                "A",
                                t("Lane A"),
                                t(
                                  "For bodies whose identity is proven by an official email domain, such as schools (.edu.vn) and government agencies (.gov.vn). Check the contact domain by eye; documents may be waived with a reason, and the Blue Tick is granted on approval.",
                                ),
                              ],
                              [
                                "B",
                                t("Lane B"),
                                t(
                                  "For clubs, NGOs and social enterprises, usually on Gmail or their own domain. Legal documents are required, and the organization is approved without a Blue Tick — it earns one later through its activity.",
                                ),
                              ],
                            ] as [ApplicationLane, string, string][]
                          ).map(([value, label, explanation]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleLaneChange(value)}
                              className={cn(
                                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                                lane === value
                                  ? isDark
                                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                                    : "border-zinc-900 bg-zinc-900 text-white"
                                  : isDark
                                    ? "border-zinc-700 hover:bg-zinc-800"
                                    : "border-zinc-300 hover:bg-zinc-100",
                              )}
                            >
                              {label}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    aria-label={explanation}
                                    className="inline-flex opacity-50 transition-opacity hover:opacity-100"
                                  >
                                    <TbHelpCircle className="size-3.5" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs font-normal leading-relaxed"
                                >
                                  {explanation}
                                </TooltipContent>
                              </Tooltip>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "Picking a lane pre-fills the waive and Blue Tick options below; you can still change both.",
                          )}
                        </p>

                        <label className="flex items-start gap-3 text-sm">
                          <Checkbox
                            className={checkboxClassName}
                            checked={waiveDocuments}
                            onCheckedChange={(checked) =>
                              setWaiveDocuments(checked === true)
                            }
                          />
                          <span>
                            {t(
                              "Waive the document requirement (official domain confirmed by eye)",
                            )}
                          </span>
                        </label>

                        {waiveDocuments && (
                          <Textarea
                            value={waiveReason}
                            onChange={(event) => setWaiveReason(event.target.value)}
                            placeholder={t(
                              "Why are documents not needed? e.g. official uit.edu.vn domain",
                            )}
                            rows={2}
                            className={textareaClassName}
                          />
                        )}

                        <label className="flex items-start gap-3 text-sm">
                          <Checkbox
                            className={checkboxClassName}
                            checked={grantBlueTick}
                            onCheckedChange={(checked) =>
                              setGrantBlueTick(checked === true)
                            }
                          />
                          <span>
                            {t(
                              "Grant the Blue Tick now (lane B usually earns it later, once it has a track record)",
                            )}
                          </span>
                        </label>
                      </div>
                    )}

                    {decision === "REQUEST_INFO" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                          {t("What does the applicant need to add?")}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {REQUEST_INFO_REASONS.map((reason) => (
                            <label
                              key={reason}
                              className="flex items-start gap-3 text-sm"
                            >
                              <Checkbox
                                className={checkboxClassName}
                                checked={infoReasons.includes(reason)}
                                onCheckedChange={(checked) =>
                                  toggleInfoReason(reason, checked === true)
                                }
                              />
                              <span>{t(reason)}</span>
                            </label>
                          ))}
                        </div>
                        {isOtherPicked && (
                          <Textarea
                            value={otherReason}
                            onChange={(event) => setOtherReason(event.target.value)}
                            placeholder={t("Describe the other reason")}
                            rows={3}
                            className={textareaClassName}
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "The selected reasons are joined with commas and sent to the applicant.",
                          )}
                        </p>
                      </div>
                    )}

                    {decision === "REJECT" && (
                      <Textarea
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder={t("Why is this application not approved?")}
                        rows={4}
                        className={textareaClassName}
                      />
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={onClose}>
                        {t("Cancel")}
                      </Button>
                      <Button
                        disabled={isDeciding || isRequestingInfo}
                        onClick={handleSubmit}
                      >
                        {t("Confirm")}
                      </Button>
                    </div>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
                  )}
                >
                  <ApplicationActivity
                    events={application.events ?? []}
                    documents={application.documents ?? []}
                    isDark={isDark}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ApplicationReviewDialog;
