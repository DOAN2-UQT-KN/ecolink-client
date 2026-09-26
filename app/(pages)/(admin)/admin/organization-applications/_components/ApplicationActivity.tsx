import { ReactNode, memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  TbArrowBackUp,
  TbBuildingCommunity,
  TbCircleCheck,
  TbCircleX,
  TbEye,
  TbFileOff,
  TbHistory,
  TbMessageQuestion,
  TbRefresh,
  TbSend,
  TbUserCheck,
  TbUserX,
  TbClockOff,
  TbUserMinus,
  TbMailForward,
  TbListCheck,
  TbArrowsShuffle,
} from "react-icons/tb";

import type {
  IApplicationDocument,
  IApplicationEvent,
} from "@/apis/organization-application/models/application";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";

type Tone = "cyan" | "blue" | "amber" | "emerald" | "red" | "zinc";

/** Labels stay untranslated English; they go through `t()` at render time. */
const EVENT_META: Record<string, { label: string; icon: IconType; tone: Tone }> = {
  SUBMITTED: { label: "Submitted", icon: TbSend, tone: "cyan" },
  RESUBMITTED: { label: "Resubmitted", icon: TbRefresh, tone: "cyan" },
  CLAIMED: { label: "Claimed for review", icon: TbUserCheck, tone: "blue" },
  INFO_REQUESTED: {
    label: "Requested more information",
    icon: TbMessageQuestion,
    tone: "amber",
  },
  APPROVED: { label: "Approved", icon: TbCircleCheck, tone: "emerald" },
  DOCUMENTS_WAIVED: { label: "Documents waived", icon: TbFileOff, tone: "amber" },
  REJECTED: { label: "Rejected", icon: TbCircleX, tone: "red" },
  WITHDRAWN: { label: "Withdrawn by applicant", icon: TbArrowBackUp, tone: "zinc" },
  DOCUMENT_VIEWED: { label: "Document opened", icon: TbEye, tone: "zinc" },
  OWNER_CONFIRMED: { label: "Owner confirmed", icon: TbUserCheck, tone: "emerald" },
  OWNER_DECLINED: { label: "Owner declined", icon: TbUserX, tone: "red" },
  OWNER_EXPIRED: { label: "Owner confirmation expired", icon: TbClockOff, tone: "amber" },
  OWNER_CANDIDATE_REMOVED: { label: "Owner removed from the list", icon: TbUserMinus, tone: "zinc" },
  OWNER_CONFIRMATIONS_RESET: {
    label: "Confirmations reset",
    icon: TbArrowsShuffle,
    tone: "amber",
  },
  OWNER_INVITE_RESENT: { label: "Confirmation email resent", icon: TbMailForward, tone: "zinc" },
  READY_FOR_REVIEW: { label: "All owners confirmed", icon: TbListCheck, tone: "blue" },
  DRAFT_UPDATE_NOTIFIED: {
    label: "Applicant saved the draft (email sent)",
    icon: TbMailForward,
    tone: "zinc",
  },
  OWNER_ATTACHED: {
    label: "Owner notified of their role",
    icon: TbBuildingCommunity,
    tone: "emerald",
  },
};

/** Events written by the system or by an owner answering their email, not by the submitter. */
const NON_APPLICANT_EVENTS = new Set([
  "OWNER_CONFIRMED",
  "OWNER_DECLINED",
  "OWNER_EXPIRED",
  "READY_FOR_REVIEW",
  "OWNER_ATTACHED",
]);

const TONE_CLASSES: Record<Tone, { light: string; dark: string }> = {
  cyan: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-500/15 text-cyan-300" },
  blue: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-500/15 text-blue-300" },
  amber: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/15 text-amber-300" },
  emerald: {
    light: "bg-emerald-100 text-emerald-700",
    dark: "bg-emerald-500/15 text-emerald-300",
  },
  red: { light: "bg-red-100 text-red-700", dark: "bg-red-500/15 text-red-300" },
  zinc: { light: "bg-zinc-100 text-zinc-600", dark: "bg-zinc-700 text-zinc-300" },
};

/** What the resubmit payload's `changedFields` entries mean to a reviewer. */
const FIELD_LABELS: Record<string, string> = {
  orgType: "Type",
  "profile.name": "Name",
  "profile.description": "Description",
  "profile.address": "Address",
  "profile.logoUrl": "Logo",
  "profile.backgroundUrl": "Cover image",
  "profile.latitude": "Map location",
  "profile.longitude": "Map location",
  "profile.location": "Map location",
  "profile.contactEmail": "Contact email",
  channels: "Official channels",
  legalRepresentative: "Legal representative",
  owners: "Owners",
};

// The payload is free-form JSON written by several code paths; read it defensively.
const readString = (payload: unknown, key: string): string | null => {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return typeof value === "string" && value.trim() ? value : null;
};
const readArray = (payload: unknown, key: string): string[] => {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
};
const readBoolean = (payload: unknown, key: string): boolean =>
  (payload as Record<string, unknown> | null)?.[key] === true;
const readNumber = (payload: unknown, key: string): number | null => {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return typeof value === "number" ? value : null;
};

/**
 * Audit trail of one application, newest first. Document views are hidden by default: they
 * pile up quickly and bury the status changes a reviewer usually looks for.
 */
export const ApplicationActivity = memo(function ApplicationActivity({
  events,
  documents,
  isDark,
}: {
  events: IApplicationEvent[];
  documents: IApplicationDocument[];
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const [showDocumentViews, setShowDocumentViews] = useState(false);

  const viewCount = useMemo(
    () => events.filter((event) => event.event_type === "DOCUMENT_VIEWED").length,
    [events],
  );
  const visible = useMemo(
    () =>
      [...events]
        .filter(
          (event) => showDocumentViews || event.event_type !== "DOCUMENT_VIEWED",
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [events, showDocumentViews],
  );

  const actorOf = (event: IApplicationEvent) => {
    if (event.actor_name) return event.actor_name;
    if (event.actor_id) return t("Admin");
    if (event.event_type === "OWNER_CONFIRMED" || event.event_type === "OWNER_DECLINED") {
      return readString(event.payload, "email") ?? t("Owner");
    }
    return NON_APPLICANT_EVENTS.has(event.event_type) ? t("System") : t("Applicant");
  };

  const quote = (text: string) => (
    <p
      className={cn(
        "whitespace-pre-line rounded-md border-l-2 px-3 py-1.5 text-xs",
        isDark ? "border-zinc-600 bg-zinc-800 text-zinc-300" : "border-zinc-300 bg-zinc-50 text-zinc-700",
      )}
    >
      {text}
    </p>
  );

  const chip = (label: string, key: string) => (
    <span
      key={key}
      className={cn(
        "rounded-md px-2 py-0.5 text-xs",
        isDark ? "bg-zinc-700 text-zinc-200" : "bg-zinc-100 text-zinc-700",
      )}
    >
      {label}
    </span>
  );

  const detailsOf = (event: IApplicationEvent): ReactNode => {
    const { payload } = event;
    switch (event.event_type) {
      case "SUBMITTED": {
        const count = readNumber(payload, "ownerCount");
        return count === null ? null : (
          <p className="text-xs text-muted-foreground">
            {t("{{count}} owners listed", { count })}
          </p>
        );
      }
      case "OWNER_DECLINED": {
        const reason = readString(payload, "reason");
        return reason ? quote(reason) : null;
      }
      case "OWNER_EXPIRED":
      case "OWNER_CANDIDATE_REMOVED": {
        const emails = [
          ...readArray(payload, "emails"),
          ...(readString(payload, "email") ? [readString(payload, "email") as string] : []),
        ];
        return emails.length ? (
          <p className="text-xs text-muted-foreground">{emails.join(", ")}</p>
        ) : null;
      }
      case "RESUBMITTED": {
        // Latitude and longitude share one label; show it once.
        const fields = [
          ...new Set(
            readArray(payload, "changedFields").map((field) =>
              t(FIELD_LABELS[field] ?? field),
            ),
          ),
        ];
        const added = readArray(payload, "addedDocumentIds").length;
        const removed = readArray(payload, "removedDocumentIds").length;
        if (!fields.length && !added && !removed) {
          return (
            <p className="text-xs text-muted-foreground">
              {t("No changes recorded")}
            </p>
          );
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {fields.map((field) => chip(field, field))}
            {added > 0 && chip(t("+{{count}} documents", { count: added }), "added")}
            {removed > 0 &&
              chip(t("−{{count}} documents", { count: removed }), "removed")}
          </div>
        );
      }
      case "INFO_REQUESTED": {
        const message = readString(payload, "message");
        return message ? quote(message) : null;
      }
      case "REJECTED": {
        const reason = readString(payload, "rejectReason");
        return reason ? quote(reason) : null;
      }
      case "APPROVED": {
        const lane = readString(payload, "lane");
        return (
          <div className="flex flex-wrap gap-1.5">
            {lane && chip(t(`Lane ${lane}`), "lane")}
            {readBoolean(payload, "grantBlueTick") && chip(t("Blue Tick granted"), "tick")}
          </div>
        );
      }
      case "DOCUMENTS_WAIVED": {
        const reason = readString(payload, "reason");
        return reason ? quote(reason) : null;
      }
      case "DOCUMENT_VIEWED": {
        const documentId = readString(payload, "documentId");
        const document = documents.find((d) => d.id === documentId);
        const name = document?.file_name ?? readString(payload, "docType");
        return name ? (
          <p className="text-xs text-muted-foreground">{name}</p>
        ) : null;
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {viewCount > 0 && (
        <label className="flex items-center gap-2 self-end text-xs text-muted-foreground">
          <Checkbox
            className={
              isDark
                ? "border-zinc-600 data-checked:border-zinc-100 data-checked:bg-zinc-100 data-checked:text-zinc-900 dark:data-checked:bg-zinc-100"
                : "border-zinc-400 data-checked:border-zinc-900 data-checked:bg-zinc-900 data-checked:text-white"
            }
            checked={showDocumentViews}
            onCheckedChange={(checked) => setShowDocumentViews(checked === true)}
          />
          {t("Show document views ({{count}})", { count: viewCount })}
        </label>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No activity yet.")}</p>
      ) : (
        <ol className="flex flex-col">
          {visible.map((event, index) => {
            const meta = EVENT_META[event.event_type];
            const Icon = meta?.icon ?? TbHistory;
            const tone = TONE_CLASSES[meta?.tone ?? "zinc"];
            const details = detailsOf(event);
            const isLast = index === visible.length - 1;
            return (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      isDark ? tone.dark : tone.light,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className={cn(
                        "w-px flex-1",
                        isDark ? "bg-zinc-700" : "bg-zinc-200",
                      )}
                    />
                  )}
                </div>
                <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", !isLast && "pb-4")}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold">
                      {meta ? t(meta.label) : event.event_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formattedDate(event.created_at, true)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("by {{actor}}", { actor: actorOf(event) })}
                  </span>
                  {details}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
});

export default ApplicationActivity;
