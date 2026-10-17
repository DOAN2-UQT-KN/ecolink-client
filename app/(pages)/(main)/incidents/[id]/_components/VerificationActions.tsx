import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteReport } from "@/apis/incident/deleteReport";
import type { IIncident } from "@/apis/incident/models/incident";
import { Button } from "@/components/client/shared/Button";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";
import type { VerificationOutcome } from "@/constants/reportVerification";
import { useRouter } from "@/libs/router";

/**
 * Next step for the owner (specs/007 US3): withdraw while waiting for review, or start a new report
 * once rejected. "View similar report" lives in its IssueCard (specs/010).
 */
export default function VerificationActions({
  incident,
  outcome,
}: {
  incident: IIncident;
  outcome: VerificationOutcome;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteReport, isPending: deleting } = useDeleteReport({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      router.push("/incidents/me");
    },
  });

  // The server refuses edits on rejected reports; withdrawing a report a campaign already took is not offered.
  const canWithdraw = outcome !== "rejected" && !incident.handled_by;

  const action =
    outcome === "rejected" ? (
      <Button variant="brown" onClick={() => router.push("/incidents/create")}>
        {t("Create a new report")}
      </Button>
    ) : canWithdraw ? (
      <ConfirmPopover
        theme="light"
        trigger={<Button variant="outlined-brown">{t("Withdraw report")}</Button>}
        title={t("Withdraw this report?")}
        description={t("The report will be removed and cannot be restored.")}
        confirmLabel={t("Withdraw report")}
        confirmPending={deleting}
        onConfirm={async () => {
          try {
            await deleteReport(incident.id);
            return true;
          } catch {
            return false;
          }
        }}
      />
    ) : null;

  if (!action) return null;

  return (
    // Below 640 px the action sticks to the bottom of the screen; the panel reserves the space.
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-end border-t border-border bg-background-primary p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
      {action}
    </div>
  );
}
