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
import StepDocuments from "./StepDocuments";
import StepReview from "./StepReview";

/**
 * The step-by-step form, shared by a new application and a resubmission. Must render inside
 * `ApplicationProvider`, which decides which steps exist.
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
  const { step, stepIndex, isEditMode, back, next, submit, isSubmitting } =
    useApplication();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The first step of a resubmission has nothing before it to go back to.
  const canGoBack = !(isEditMode && stepIndex === 0);

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
            {step === "documents" && <StepDocuments />}
            {step === "review" && <StepReview />}
          </div>
        )}

        {step !== "email" && (
          <div
            className={cn(
              "flex gap-3",
              canGoBack ? "justify-between" : "justify-end",
            )}
          >
            {canGoBack && (
              <Button variant="outlined-brown" onClick={back}>
                {t("Back")}
              </Button>
            )}
            {step === "review" ? (
              <Button
                variant="brown"
                onClick={submit}
                isDisabled={isSubmitting}
              >
                {isSubmitting
                  ? t("Submitting...")
                  : isEditMode
                    ? t("Resubmit application")
                    : t("Submit application")}
              </Button>
            ) : (
              <Button variant="brown" onClick={next}>
                {t("Continue")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplyForm;
