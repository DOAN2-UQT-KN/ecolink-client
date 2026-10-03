import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import {
  BreadcrumbItemProps,
  Breadcrumbs,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Stepper } from "@/components/client/shared/Stepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/libs/utils";
import {
  CAMPAIGN_STATUS,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_SUBMITTABLE_STATUSES,
} from "@/constants/campaignLifecycle";

import GeneralInformation from "./GeneralInformation";
import StepSchedule from "./StepSchedule";
import MeetingPointsEditor from "./MeetingPointsEditor";
import StepReview from "./StepReview";
import StepShifts from "./StepShifts";
import { useCampaign } from "../_hooks/useCampaign";
import { CAMPAIGN_STEPS, type CampaignStep } from "../_context/CampaignContext";

const STEP_LABELS: Record<CampaignStep, string> = {
  general: "General information",
  schedule: "Schedule and contact",
  meeting_points: "Meeting points",
  shifts: "Shifts",
  review: "Review & submit",
};

/**
 * The create/edit wizard (same pattern as the organization application): stepper, the review
 * status banner, the current step, and Back / Save draft / Continue or Send for review.
 */
const CampaignForm = memo(function CampaignForm() {
  const { t } = useTranslation("common");
  const {
    campaign,
    organization,
    saveDraft,
    submitForReview,
    isSaving,
    isSubmitting,
    isUploading,
    issues,
    step,
    stepIndex,
    maxVisitedIndex,
    errorStepIds,
    next,
    back,
    goToStep,
    approvedEdit,
    hasMajorChange,
  } = useCampaign();
  const [isScrolled, setIsScrolled] = useState(false);
  /** A save waiting for the manager to accept sending the campaign back for review. */
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);

  /** Approved campaign (spec 3.5): a save that changes an important field asks first. */
  const guardMajor = (action: () => Promise<void>) => {
    if (approvedEdit && hasMajorChange()) setPendingSave(() => action);
    else void action();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // A new campaign is started from its organization's page, so the trail leads back there.
  const breadcrumbs = useMemo<BreadcrumbItemProps[]>(
    () =>
      campaign || !organization
        ? [
            { label: "Home", path: "/", type: "link" },
            { label: "My campaigns", path: "/campaigns/me", type: "link" },
            { label: "Edit campaign", path: "#", type: "page" },
          ]
        : [
            { label: "Home", path: "/", type: "link" },
            { label: organization.name, path: `/organizations/${organization.id}`, type: "link" },
            { label: "Create campaign", path: "#", type: "page" },
          ],
    [campaign, organization],
  );

  const stepItems = useMemo(
    () => CAMPAIGN_STEPS.map((id) => ({ id, label: t(STEP_LABELS[id]) })),
    [t],
  );

  const status = campaign?.status ?? CAMPAIGN_STATUS.DRAFT;
  const canSubmit = CAMPAIGN_SUBMITTABLE_STATUSES.includes(status);
  const busy = isSaving || isSubmitting || isUploading;
  const isLastStep = step === "review";

  return (
    <div className="w-full h-full">
      <div
        className={cn(
          "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20",
          isScrolled ? "pt-[100px]" : "pt-0",
        )}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      <div className="flex flex-col gap-[30px] w-full h-full pt-5">
        {campaign && (
          <div className="flex flex-col gap-1 rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white/80 px-5 py-4 text-sm">
            <span>
              {t("Status")}: <strong>{t(CAMPAIGN_STATUS_LABEL[status] ?? "Draft")}</strong>
            </span>
            {status === CAMPAIGN_STATUS.NEEDS_REVISION && (
              <>
                {campaign.reject_reason && (
                  <span>
                    {t("Admin's request")}: {campaign.reject_reason}
                  </span>
                )}
                {campaign.revision_deadline && (
                  <span className="text-amber-700">
                    {t("Resubmit before {{date}}, or the campaign expires and its waste points are released", {
                      date: format(new Date(campaign.revision_deadline), "PPP"),
                    })}
                  </span>
                )}
              </>
            )}
            {status === CAMPAIGN_STATUS.PENDING_REVIEW && (
              <span className="text-foreground-tertiary">
                {approvedEdit
                  ? t("Under review again after an edit. Volunteers keep their place; new sign-ups are paused.")
                  : t("Waiting for admin review. Your edits are saved and shown to the admin.")}
              </span>
            )}
            {approvedEdit && (
              <span className="text-foreground-tertiary">
                {t(
                  "Title, description, banner, contact, safety notes and shift numbers save at once. Changing the meeting points, days or their hours, waste points, difficulty or conditions sends the campaign back for review.",
                )}
              </span>
            )}
          </div>
        )}

        <Stepper
          steps={stepItems}
          currentIndex={stepIndex}
          onStepClick={goToStep}
          isClickable={(index) => index <= maxVisitedIndex}
          errorIds={errorStepIds}
        />

        {issues.length > 0 && (
          <div
            role="alert"
            className="rounded-[10px] border border-destructive/50 bg-destructive/5 px-5 py-4 text-sm"
          >
            <p className="font-semibold text-destructive">
              {t("Fix these before sending for review")}
            </p>
            <ul className="mt-2 list-disc pl-5">
              {issues.map((issue, i) => (
                <li key={`${issue.field}-${i}`}>{t(issue.message)}</li>
              ))}
            </ul>
          </div>
        )}

        {step === "general" && <GeneralInformation />}
        {step === "schedule" && <StepSchedule />}
        {step === "meeting_points" && <MeetingPointsEditor />}
        {step === "shifts" && <StepShifts />}
        {step === "review" && (
          <div className="rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white/80 px-[24px] py-[28px] shadow-sm lg:px-[30px] lg:py-[35px]">
            <StepReview />
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <Button variant="outlined-brown" onClick={back} isDisabled={busy}>
                {t("Back")}
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="outlined-brown" onClick={() => guardMajor(saveDraft)} isDisabled={busy}>
              {isUploading ? t("Uploading...") : isSaving ? t("Saving...") : t("Save draft")}
            </Button>
            {!isLastStep ? (
              <Button variant="brown" onClick={() => guardMajor(next)} isDisabled={busy}>
                {t("Continue")}
              </Button>
            ) : (
              canSubmit && (
                <Button variant="brown" onClick={() => void submitForReview()} isDisabled={busy}>
                  {isSubmitting
                    ? t("Sending...")
                    : status === CAMPAIGN_STATUS.NEEDS_REVISION
                      ? t("Resubmit for review")
                      : t("Send for review")}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <Dialog open={pendingSave != null} onOpenChange={(open) => !open && setPendingSave(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Send the campaign back for review?")}</DialogTitle>
            <DialogDescription>
              {t(
                "You changed an important field. The campaign goes back to Pending review until an admin approves it again: registered volunteers keep their place and are notified, and new sign-ups are paused meanwhile.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setPendingSave(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="brown"
              isDisabled={busy}
              onClick={() => {
                const action = pendingSave;
                setPendingSave(null);
                void action?.();
              }}
            >
              {t("Save and send for review")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CampaignForm;
