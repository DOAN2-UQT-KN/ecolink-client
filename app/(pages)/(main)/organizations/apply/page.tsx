import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";
import { ApplicationProvider } from "./_context/ApplicationContext";
import { useApplication } from "./_hooks/useApplication";
import Stepper from "./_components/Stepper";
import StepEmail, { stepCardClassName } from "./_components/StepEmail";
import StepProfile from "./_components/StepProfile";
import StepContact from "./_components/StepContact";
import StepDocuments from "./_components/StepDocuments";
import StepReview from "./_components/StepReview";

// `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Apply", path: "/organizations/apply", type: "page" },
];

function ApplyContent() {
  const { t } = useTranslation();
  const { step, back, next, submit, isSubmitting } = useApplication();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <div className="flex justify-between gap-3">
            <Button variant="outlined-brown" onClick={back}>
              {t("Back")}
            </Button>
            {step === "review" ? (
              <Button
                variant="brown"
                onClick={submit}
                isDisabled={isSubmitting}
              >
                {isSubmitting ? t("Submitting...") : t("Submit application")}
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

export default function OrganizationApplyPage() {
  return (
    <ApplicationProvider>
      <ApplyContent />
    </ApplicationProvider>
  );
}
