import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import {
  BreadcrumbItemProps,
  Breadcrumbs,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";
import {
  CAMPAIGN_STATUS,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_SUBMITTABLE_STATUSES,
} from "@/constants/campaignLifecycle";

import GeneralInformation from "./GeneralInformation";
import ContactAndSafety from "./ContactAndSafety";
import MeetingPointsEditor from "./MeetingPointsEditor";
import { useCampaign } from "../_hooks/useCampaign";

/** The create/edit form: sections, the review status banner, and Save draft / Send for review. */
const CampaignForm = memo(function CampaignForm() {
  const { t } = useTranslation("common");
  const { campaign, saveDraft, submitForReview, isSaving, isSubmitting, isUploading, issues } =
    useCampaign();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const breadcrumbs = useMemo<BreadcrumbItemProps[]>(
    () => [
      { label: "Home", path: "/", type: "link" },
      { label: "My campaigns", path: "/campaigns/me", type: "link" },
      { label: campaign ? "Edit campaign" : "Create campaign", path: "#", type: "page" },
    ],
    [campaign],
  );

  const status = campaign?.status ?? CAMPAIGN_STATUS.DRAFT;
  const canSubmit = CAMPAIGN_SUBMITTABLE_STATUSES.includes(status);
  const busy = isSaving || isSubmitting || isUploading;

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

      {campaign && (
        <div className="mt-5 flex flex-col gap-1 rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white/80 px-5 py-4 text-sm">
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
              {t("Waiting for admin review. Your edits are saved and shown to the admin.")}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-[20px] w-full h-full pt-5">
        <GeneralInformation />
        <ContactAndSafety />
        <MeetingPointsEditor />
      </div>

      {issues.length > 0 && (
        <div role="alert" className="mt-5 rounded-[10px] border border-destructive/50 bg-destructive/5 px-5 py-4 text-sm">
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

      <div className="flex flex-wrap justify-end gap-3 pt-5">
        <Button variant="outlined-brown" onClick={() => void saveDraft()} disabled={busy}>
          {isUploading ? t("Uploading...") : isSaving ? t("Saving...") : t("Save draft")}
        </Button>
        {canSubmit && (
          <Button variant="brown" onClick={() => void submitForReview()} disabled={busy}>
            {isSubmitting
              ? t("Sending...")
              : status === CAMPAIGN_STATUS.NEEDS_REVISION
                ? t("Resubmit for review")
                : t("Send for review")}
          </Button>
        )}
      </div>
    </div>
  );
});

export default CampaignForm;
