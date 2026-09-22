import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbExternalLink, TbFileText } from "react-icons/tb";

import {
  buildApplicationDocumentUrl,
  useClaimApplication,
  useDecideApplication,
  useGetAdminApplicationById,
  useRequestMoreInfo,
} from "@/apis/organization-application/adminApplications";
import type { ApplicationLane } from "@/apis/organization-application/models/application";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { formattedDate } from "@/utils/formattedDate";

type Decision = "APPROVE" | "REJECT" | "REQUEST_INFO";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-[180px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 break-words text-sm">{value || "—"}</span>
    </div>
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
  const { data, isLoading } = useGetAdminApplicationById(applicationId);
  const application = data?.data?.application;

  const [decision, setDecision] = useState<Decision>("APPROVE");
  const [lane, setLane] = useState<ApplicationLane>("B");
  const [waiveDocuments, setWaiveDocuments] = useState(false);
  const [waiveReason, setWaiveReason] = useState("");
  const [grantBlueTick, setGrantBlueTick] = useState(false);
  const [message, setMessage] = useState("");

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
    const [local, domain] = (application?.contact_email ?? "").split("@");
    return { local, domain };
  }, [application?.contact_email]);

  const isClosed =
    application?.status === "APPROVED" ||
    application?.status === "REJECTED" ||
    application?.status === "WITHDRAWN";

  const handleSubmit = useCallback(async () => {
    if (!application) return;

    if (decision === "REQUEST_INFO") {
      if (!message.trim()) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Describe what is missing"),
        });
        return;
      }
      await requestInfoAsync({ id: application.id, message: message.trim() });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("Requested more information from the applicant"),
      });
      onClose();
      return;
    }

    if (decision === "REJECT") {
      if (!message.trim()) {
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
        reject_reason: message.trim(),
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
    lane,
    message,
    onClose,
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Review application")}</DialogTitle>
        </DialogHeader>

        {isLoading || !application ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* The contact domain decides lane A, so it leads. */}
            <section className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("Contact email")}
              </p>
              <p className="mt-1 text-lg">
                <span className="text-muted-foreground">
                  {contactEmailParts.local}@
                </span>
                <span className="font-semibold">
                  {contactEmailParts.domain}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "Ownership of this mailbox was confirmed by a one-time code before the application was submitted.",
                )}
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-semibold">{t("Organization profile")}</h3>
              <Row label={t("Name")} value={application.profile?.name} />
              <Row label={t("Type")} value={t(application.org_type)} />
              <Row label={t("Address")} value={application.profile?.address} />
              <Row label={t("Tracking code")} value={application.code} />
              <Row
                label={t("Submitted")}
                value={formattedDate(application.submitted_at)}
              />
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-semibold">{t("Official channels")}</h3>
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
                        className="inline-flex items-center gap-1 text-blue-600 underline"
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
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-semibold">{t("Legal representative")}</h3>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Review-only. Never shown publicly, and only the last 4 characters of the ID number are stored.",
                )}
              </p>
              <Row
                label={t("Full name")}
                value={application.legal_representative?.full_name}
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
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-semibold">{t("Legal documents")}</h3>
              {application.documents?.length ? (
                <ul className="flex flex-col gap-2">
                  {application.documents.map((document) => (
                    <li key={document.id}>
                      <a
                        href={buildApplicationDocumentUrl(
                          application.id,
                          document.id,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 underline"
                      >
                        <TbFileText />
                        {document.file_name ?? document.doc_type}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("No documents attached.")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("Every time a document is opened it is written to the audit log.")}
              </p>
            </section>

            {isClosed ? (
              <section className="rounded-lg bg-muted p-4 text-sm">
                {t("This application has already been decided.")}
              </section>
            ) : (
              <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{t("Decision")}</h3>
                  {application.status !== "UNDER_REVIEW" && (
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

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["APPROVE", t("Approve")],
                      ["REQUEST_INFO", t("Request more information")],
                      ["REJECT", t("Reject")],
                    ] as [Decision, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDecision(value)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm",
                        decision === value
                          ? "border-transparent bg-foreground text-background"
                          : "border-border",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {decision === "APPROVE" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["A", t("Lane A — fast track")],
                          ["B", t("Lane B — standard")],
                        ] as [ApplicationLane, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleLaneChange(value)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm",
                            lane === value
                              ? "border-transparent bg-foreground text-background"
                              : "border-border",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
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
                      />
                    )}

                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
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
                ) : (
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      decision === "REJECT"
                        ? t("Why is this application not approved?")
                        : t("What does the applicant need to add?")
                    }
                    rows={4}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ApplicationReviewDialog;
