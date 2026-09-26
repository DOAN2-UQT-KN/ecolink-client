import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";
import { useApplication } from "../_hooks/useApplication";
import Stepper from "./Stepper";
import StepEmail, { stepCardClassName } from "./StepEmail";
import StepProfile from "./StepProfile";
import StepContact from "./StepContact";
import StepOwners from "./StepOwners";
import StepDocuments from "./StepDocuments";
import StepReview from "./StepReview";

/**
 * The step-by-step form: the email gate for a new application, or the draft editor behind
 * the tracking link. Must render inside `ApplicationProvider`, which decides which steps
 * exist.
 */
export function ApplyForm({
  breadcrumbs,
  notice,
}: {
  breadcrumbs: BreadcrumbItemProps[];
  /** Shown above the stepper, e.g. the reviewer's note on a resubmission. */
  notice?: ReactNode;
}) {
  const { t } = useTranslation();
  const {
    step,
    stepIndex,
    application,
    back,
    next,
    submit,
    isSubmitting,
    saveDraft,
    isSaving,
  } = useApplication();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The first step of the editor has nothing before it to go back to.
  const canGoBack = stepIndex > 0;
  const isRevision = application?.status === "NEEDS_REVISION";

  return (
    <div className="w-full h-full">
      {/* Sticky breadcrumbs; the negative margins bleed past MainLayout's padding so the bar
          spans the viewport, and pt-[100px] covers the transparent header gap once scrolled. */}
      <div
        className={cn(
          "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20",
          isScrolled ? "pt-[100px]" : "pt-0",
        )}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      <div className="flex flex-col gap-[30px] w-full h-full pt-5">
        {notice}

        <Stepper />

        {/* The email step draws its own two cards side by side; the rest share one. */}
        {step === "email" ? (
          <StepEmail />
        ) : (
          <div className={stepCardClassName}>
            {step === "profile" && <StepProfile />}
            {step === "contact" && <StepContact />}
            {step === "owners" && <StepOwners />}
            {step === "documents" && <StepDocuments />}
            {step === "review" && <StepReview />}
          </div>
        )}

        {step !== "email" && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              {canGoBack && (
                <Button variant="outlined-brown" onClick={back}>
                  {t("Back")}
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="outlined-brown"
                onClick={() => void saveDraft()}
                isDisabled={isSaving || isSubmitting}
              >
                {isSaving ? t("Saving...") : t("Save draft")}
              </Button>
              {step === "review" ? (
                <Button
                  variant="brown"
                  onClick={submit}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting
                    ? t("Submitting...")
                    : isRevision
                      ? t("Resubmit application")
                      : t("Submit application")}
                </Button>
              ) : (
                <Button variant="brown" onClick={next} isDisabled={isSaving}>
                  {t("Continue")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplyForm;
