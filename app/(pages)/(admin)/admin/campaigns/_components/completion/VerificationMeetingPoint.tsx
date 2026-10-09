import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TbExternalLink, TbThumbDown, TbThumbUp } from "react-icons/tb";
import {
  type ICompletionReviewReport,
} from "@/apis/campaign/processCampaign";
import type { IResultPhotoCheck } from "@/apis/campaign/shiftResult";
import type { IMeetingPointView } from "@/apis/campaign/verification";
import { checksByUrl, meetingPointLabel, MeetingPointStatusPill, PhotoCheckBadge, MeetingPointDecisionActions, MeetingPointVotesList } from "@/modules/CampaignVerification";
import { CHECK_LEVEL_LABEL, TRASH_POINT_RESULT_LABEL } from "@/constants/campaignVerification";
import { ReviewSectionCard } from "@/components/ui/ReviewSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";

/** Before or after photos; only a photo with a warning, a failure or no check carries a badge (hover: why). */
function Photos({
  label,
  urls,
  checks,
  isDark,
}: {
  label: string;
  urls: string[];
  /** Layer 1 checks by URL; badges show only when given. */
  checks?: Map<string, IResultPhotoCheck | null>;
  isDark?: boolean;
}) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url) => {
          const check = checks ? (checks.get(url) ?? null) : undefined;
          return (
            <div key={url} className="relative">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" loading="lazy" className="size-16 rounded-md border object-cover" />
              </a>
              {check !== undefined && check?.level !== "pass" && (
                <PhotoCheckBadge check={check} isDark={isDark} className="absolute bottom-1 left-1 shadow-sm" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** How many voted clean / not clean; each opens a dialog with those votes in detail. */
function MeetingPointVotesButtons({
  votes,
  titleById,
  title,
  isDark,
}: {
  votes: IMeetingPointView["votes"];
  titleById: Map<string, string>;
  title: string;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<"up" | "down" | null>(null);
  const count = (side: "up" | "down") => votes.filter((v) => v.value === side).length;
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {(["up", "down"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setOpen(side)}
            className={cn(
              "inline-flex items-center gap-1 underline-offset-2 hover:underline",
              side === "up"
                ? isDark ? "text-emerald-300" : "text-emerald-700"
                : isDark ? "text-red-300" : "text-red-700",
            )}
          >
            {side === "up" ? <TbThumbUp className="size-4" aria-hidden /> : <TbThumbDown className="size-4" aria-hidden />}
            {count(side)} {side === "up" ? t("Clean") : t("Not clean")}
          </button>
        ))}
      </div>
      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent
          className={cn("max-h-[80vh] max-w-lg overflow-y-auto", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")}
        >
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-zinc-100" : "text-zinc-900")}>
              {t("Votes")} · {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{t("Votes")}</DialogDescription>
          </DialogHeader>
          {open && (
            <MeetingPointVotesList votes={votes} titleById={titleById} isDark={isDark} defaultTab={open} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The verification score against its 15-point threshold: green once verified, red when downvoted to ≤ 3. */
function ScoreBar({ score, downvoted, isDark }: { score: number | null; downvoted: boolean; isDark: boolean }) {
  const { t } = useTranslation();
  if (score == null) return null;
  const pct = Math.min(100, (Math.max(0, score) / 15) * 100);
  const tone = score >= 15 ? "bg-emerald-500" : downvoted && score <= 3 ? "bg-red-500" : "bg-amber-500";
  return (
    <span className="flex min-w-40 flex-1 items-center gap-2 text-xs">
      <span className={cn("shrink-0 tabular-nums", isDark ? "text-zinc-300" : "text-zinc-700")}>
        {t("Score")} {score} / 15
      </span>
      <span className={cn("h-1.5 flex-1 overflow-hidden rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-200")}>
        <span className={cn("block h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** One meeting point under result verification: status, score, Layer 1, its trash points, every vote; flagged → decide. */
const RESULT_DOT: Record<string, string> = { cleaned: "bg-emerald-500", partial: "bg-amber-500", unhandled: "bg-red-500" };
const LEVEL_TEXT: Record<string, { light: string; dark: string }> = {
  pass: { light: "text-emerald-700", dark: "text-emerald-300" },
  warn: { light: "text-amber-700", dark: "text-amber-300" },
  fail: { light: "text-red-700", dark: "text-red-300" },
};

/** One trash point of the submission: what was declared (dot + word), why not handled, its photos. */
export function TrashPointEvidence({
  report,
  failed = false,
  isDark,
}: {
  report: ICompletionReviewReport;
  /** The meeting point was rejected and this trash point did not pass. */
  failed?: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const checks = report.layer1 ? checksByUrl(report.layer1) : undefined;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <a
          href={`/incidents/${report.report_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
        >
          {report.report?.title || t("Waste point")}
          <TbExternalLink className="size-3.5" aria-hidden />
        </a>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2 rounded-full", RESULT_DOT[report.status])} aria-hidden />
          {t(TRASH_POINT_RESULT_LABEL[report.status])}
        </span>
        {failed && (
          <span className={cn("text-xs font-semibold", isDark ? "text-red-300" : "text-red-700")}>
            {t("Did not pass")}
          </span>
        )}
      </div>
      {report.reason && (
        <span className="text-xs text-muted-foreground">
          {t("Why not handled")}: <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>{report.reason}</span>
        </span>
      )}
      {(report.before_urls.length > 0 || report.after_urls.length > 0) && (
        <div className="flex flex-wrap gap-4">
          <Photos label={t("Before")} urls={report.before_urls} checks={checks} isDark={isDark} />
          <Photos label={t("After")} urls={report.after_urls} checks={checks} isDark={isDark} />
        </div>
      )}
    </li>
  );
}

/** One meeting point under result verification: score, photo check, timing, votes, its trash points; flagged → decide. */
export function VerificationMeetingPoint({
  campaignId,
  point,
  index,
  reportsById,
  canDecide,
  isDark,
}: {
  campaignId: string;
  point: IMeetingPointView;
  index: number;
  reportsById: Map<string, ICompletionReviewReport>;
  canDecide: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const name = meetingPointLabel(point.name, index, t);
  const titleById = new Map(
    point.trash_points.map((tp) => [tp.report_id, tp.report?.title || t("Waste point")]),
  );
  const cleaned = point.trash_points.filter((tp) => tp.status === "cleaned");
  const timing =
    point.status === "voting"
      ? t("Voting until {{date}}", { date: formattedDate(point.window_ends_at, true) })
      : point.status === "flagged" && point.flag_deadline
        ? t("Rejected automatically on {{date}} if not decided", { date: formattedDate(point.flag_deadline, true) })
        : point.decided_at
          ? t("Decided on {{date}}", { date: formattedDate(point.decided_at, true) })
          : null;
  const failed = point.status === "rejected" ? new Set(point.failed_report_ids) : new Set<string>();

  return (
    <ReviewSectionCard
      title={name}
      hint={point.round > 1 ? t("Round {{n}}", { n: point.round }) : undefined}
      aside={<MeetingPointStatusPill status={point.status} isDark={isDark} />}
      defaultOpen={point.status === "flagged"}
      isDark={isDark}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <ScoreBar score={point.score} downvoted={point.down_count > 0} isDark={isDark} />
          <span>
            {t("Photos")}:{" "}
            <span className={cn("font-medium", LEVEL_TEXT[point.layer1_level]?.[isDark ? "dark" : "light"])}>
              {t(CHECK_LEVEL_LABEL[point.layer1_level])}
            </span>
          </span>
          {timing && <span>{timing}</span>}
        </div>
        {point.decision_reason && (
          <span className="text-xs text-muted-foreground">
            {t("Reason")}: <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>{point.decision_reason}</span>
          </span>
        )}
        <MeetingPointVotesButtons votes={point.votes} titleById={titleById} title={name} isDark={isDark} />
        <ul className={cn("flex flex-col gap-3 border-t pt-3", isDark ? "border-zinc-700" : "border-zinc-200")}>
          {point.trash_points.map((tp) => {
            const report = reportsById.get(tp.report_id);
            if (!report) return null;
            return <TrashPointEvidence key={tp.report_id} report={report} failed={failed.has(tp.report_id)} isDark={isDark} />;
          })}
        </ul>
        {canDecide && point.status === "flagged" && (
          <MeetingPointDecisionActions
            campaignId={campaignId}
            meetingPointId={point.meeting_point_id}
            trashPoints={cleaned.map((tp) => ({ id: tp.report_id, title: titleById.get(tp.report_id) ?? "" }))}
            isDark={isDark}
          />
        )}
      </div>
    </ReviewSectionCard>
  );
}
