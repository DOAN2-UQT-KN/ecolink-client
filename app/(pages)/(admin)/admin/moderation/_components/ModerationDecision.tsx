import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useModerateReport } from "@/apis/incident/moderateReport";
import type { ModerationReasonCode } from "@/apis/incident/models/verification";
import type { QueryError } from "@/hooks/reactQuery";
import { Button } from "@/components/ui/button";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/constants/apiErrorMessages";
import { MODERATION_REASONS } from "@/constants/reportVerification";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { cn } from "@/libs/utils";
import { useModerationContext } from "../_context/ModerationContext";

/** Accept / reject the selected report; a lost race (409) refreshes the queue (specs/007 FR-022, FR-023). */
export function ModerationDecision({ reportId, isDark }: { reportId: string; isDark: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { selectNext, onSelect } = useModerationContext();
  const [reason, setReason] = useState<ModerationReasonCode | "">("");
  const [note, setNote] = useState("");
  const theme = isDark ? "dark" : "light";

  const { mutateAsync, isPending } = useModerateReport({ silentError: true });

  const decide = async (decision: "ACCEPT" | "REJECT") => {
    try {
      await mutateAsync({
        id: reportId,
        data: decision === "REJECT" ? { decision, reason_code: reason || undefined, note: note.trim() || undefined } : { decision },
      });
      queryClient.invalidateQueries({ queryKey: ["reports", "verification", reportId] });
      queryClient.invalidateQueries({ queryKey: ["report-detail", reportId] });
      queryClient.invalidateQueries({ queryKey: ["all-reports"] });
      setReason("");
      setNote("");
      selectNext();
      return true;
    } catch (error) {
      const e = error as QueryError;
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: apiErrorMessage(e, t) ?? e.message ?? t("Something went wrong"),
      });
      if (e.code === "REPORT_ALREADY_MODERATED") {
        queryClient.invalidateQueries({ queryKey: ["reports", "moderation"] });
        onSelect(null);
        return true;
      }
      return false;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmPopover
        theme={theme}
        trigger={<Button disabled={isPending}>{t("Accept")}</Button>}
        title={t("Accept this report?")}
        description={t("The report becomes public and the submitter is notified.")}
        confirmLabel={t("Accept")}
        confirmPending={isPending}
        onConfirm={() => decide("ACCEPT")}
      />
      <ConfirmPopover
        theme={theme}
        trigger={
          <Button variant="destructive" disabled={isPending}>
            {t("Reject")}
          </Button>
        }
        title={t("Reject this report?")}
        description={t("The rejection reason is sent to the user together with the issues above.")}
        confirmLabel={t("Reject")}
        confirmPending={isPending}
        confirmDisabled={!reason}
        onConfirm={() => decide("REJECT")}
        extraContent={
          <div className="flex flex-col gap-3">
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as ModerationReasonCode)}
              aria-label={t("Rejection reason")}
            >
              {MODERATION_REASONS.map((r) => (
                <div key={r.value} className="flex items-center gap-2">
                  <RadioGroupItem value={r.value} id={`reject-${r.value}`} />
                  <Label htmlFor={`reject-${r.value}`} className={cn(isDark && "text-zinc-200")}>
                    {t(r.label)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={5000}
              placeholder={t("Note (optional)")}
              aria-label={t("Note (optional)")}
            />
          </div>
        }
      />
    </div>
  );
}
