import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbBan, TbCheckbox } from "react-icons/tb";

import { useReviewCampaign } from "@/apis/campaign/reviewCampaign";
import { useGetCampaignHistory } from "@/apis/campaign/getCampaignHistory";
import type { CampaignReviewDecision } from "@/apis/campaign/models/lifecycle";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

/** Spec, phase 2: what the admin checks before approving. */
const CHECKLIST = [
  "The organization is valid and its verification matches the limits",
  "Time, place and meeting points are feasible and safe",
  "Waste points match the location and the meeting point radius",
  "The difficulty is reasonable",
  "The content breaks no rules",
  "I am not a member of this organization",
] as const;

/** Readable labels for snapshot fields in the change history. */
const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  description: "Description",
  banner: "Banner",
  start_date: "Start time",
  end_date: "End time",
  difficulty: "Difficulty",
  contact_name: "Contact person",
  contact_phone: "Contact phone",
  safety_notes: "Safety notes",
  requirements: "Participation conditions",
  meeting_points: "Meeting points",
};

type Mode = "review" | "ban";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
  /** "review": a campaign waiting for review; "ban": a running campaign. */
  mode?: Mode;
};

const SUCCESS: Record<CampaignReviewDecision, string> = {
  approve: "Campaign approved",
  request_revision: "Changes requested",
  block: "Campaign blocked",
};

/** What changed on the last resubmission and while under review. */
const ChangeHistory = memo(function ChangeHistory({
  campaignId,
  isDark,
}: {
  campaignId: string;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useGetCampaignHistory(campaignId);
  const history = useMemo(() => data?.data?.history ?? [], [data]);
  // Everything since the last time it was sent back for changes.
  const recent = useMemo(() => {
    const cut = history.findIndex((h) => h.event === "request_revision");
    return (cut === -1 ? history : history.slice(0, cut)).filter(
      (h) => h.changes && Object.keys(h.changes).length > 0,
    );
  }, [history]);
  const lastRequest = history.find((h) => h.event === "request_revision");

  if (!lastRequest && recent.length === 0) return null;

  return (
    <div
      className={cn(
        "max-h-48 space-y-2 overflow-y-auto rounded-md border p-3 text-xs",
        isDark ? "border-zinc-700 text-zinc-300" : "border-zinc-200 text-zinc-700",
      )}
    >
      {lastRequest?.reason && (
        <p>
          <span className="font-semibold">{t("Changes requested")}:</span> {lastRequest.reason}
        </p>
      )}
      {recent.map((entry) => (
        <div key={entry.id}>
          <p className="font-semibold">
            {entry.event === "resubmit" ? t("Resubmitted") : t("Edited")} ·{" "}
            {formattedDate(entry.created_at)}
          </p>
          <ul className="list-disc pl-4">
            {Object.keys(entry.changes ?? {}).map((field) => (
              <li key={field}>{t(FIELD_LABEL[field] ?? field)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});

export const ReviewCampaignConfirm = memo(function ReviewCampaignConfirm({
  campaignId,
  campaignTitle,
  theme,
  mode = "review",
}: Props) {
  const { t } = useTranslation();
  const isBanMode = mode === "ban";
  const [decision, setDecision] = useState<CampaignReviewDecision>(
    isBanMode ? "block" : "approve",
  );
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);

  const { mutateAsync: reviewAsync, isPending } = useReviewCampaign();

  const resetForm = useCallback(() => {
    setDecision(isBanMode ? "block" : "approve");
    setReason("");
    setChecked(new Set());
  }, [isBanMode]);

  const needsReason = decision !== "approve";
  const checklistDone = checked.size === CHECKLIST.length;
  const confirmDisabled = needsReason ? !reason.trim() : !checklistDone;

  const handleConfirm = useCallback(async () => {
    try {
      await reviewAsync({
        id: campaignId,
        decision,
        reason: needsReason ? reason.trim() : null,
      });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t(isBanMode ? "Campaign banned successfully" : SUCCESS[decision]),
      });
      resetForm();
    } catch {
      // usePost surfaces API errors.
      return false;
    }
  }, [campaignId, decision, isBanMode, needsReason, reason, resetForm, reviewAsync, t]);

  const isDark = theme === "dark";

  return (
    <ConfirmPopover
      theme={theme}
      title={isBanMode ? t("Ban this campaign?") : t("Review campaign")}
      description={
        isBanMode
          ? t("This will ban {{name}}.", { name: campaignTitle })
          : t("Approve {{name}}, ask for changes, or block it.", { name: campaignTitle })
      }
      confirmLabel={t("Confirm")}
      cancelLabel={t("Cancel")}
      onConfirm={handleConfirm}
      confirmPending={isPending}
      confirmDisabled={confirmDisabled}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
      extraContent={
        <div className="space-y-4">
          {!isBanMode && open && <ChangeHistory campaignId={campaignId} isDark={isDark} />}

          {!isBanMode && (
            <RadioGroup
              value={decision}
              onValueChange={(value) => setDecision(value as CampaignReviewDecision)}
              disabled={isPending}
              className="flex flex-wrap items-center gap-6"
            >
              {(
                [
                  ["approve", t("Approve")],
                  ["request_revision", t("Request changes")],
                  ["block", t("Block")],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  htmlFor={`campaign-review-${value}-${campaignId}`}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem value={value} id={`campaign-review-${value}-${campaignId}`} />
                  {label}
                </label>
              ))}
            </RadioGroup>
          )}

          {!isBanMode && decision === "approve" && (
            <div className="space-y-2">
              {CHECKLIST.map((item, i) => (
                <label key={item} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={checked.has(i)}
                    onCheckedChange={(value) =>
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (value === true) next.add(i);
                        else next.delete(i);
                        return next;
                      })
                    }
                  />
                  {t(item)}
                </label>
              ))}
            </div>
          )}

          {!isBanMode && decision === "block" && (
            <p className={cn("text-xs", isDark ? "text-amber-300" : "text-amber-700")}>
              {t("Blocking is permanent and only for violations. Use Request changes for fixable problems.")}
            </p>
          )}

          {needsReason && (
            <div className="space-y-2">
              <Label
                htmlFor={`review-reason-${campaignId}`}
                className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
              >
                {t("Reason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`review-reason-${campaignId}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  decision === "request_revision"
                    ? t("What should the organization change?")
                    : t("Enter ban reason")
                }
                maxLength={5000}
                aria-required
                disabled={isPending}
                className={cn(
                  "min-h-24",
                  isDark && "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500",
                )}
              />
            </div>
          )}
        </div>
      }
      trigger={
        <button
          type="button"
          title={isBanMode ? t("Banned") : t("Review campaign")}
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
            isDark
              ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100",
            isBanMode
              ? isDark
                ? "hover:text-red-300"
                : "hover:text-red-700"
              : isDark
                ? "hover:text-green-200"
                : "hover:text-green-700",
          )}
        >
          {isBanMode ? <TbBan className="size-5" /> : <TbCheckbox className="size-5" />}
        </button>
      }
    />
  );
});

export default ReviewCampaignConfirm;
