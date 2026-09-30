import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Stepper as SharedStepper } from "@/components/client/shared/Stepper";
import { APPLICATION_STEPS } from "../_context/ApplicationContext";
import { useApplication } from "../_hooks/useApplication";

const STEP_LABELS: Record<(typeof APPLICATION_STEPS)[number], string> = {
  email: "Verify email",
  profile: "Organization profile",
  contact: "Contact",
  owners: "Owners",
  documents: "Legal documents",
  review: "Review & submit",
};

export const Stepper = memo(function Stepper() {
  const { t } = useTranslation();
  const { stepIndex, steps } = useApplication();
  const items = useMemo(
    () => steps.map((step) => ({ id: step, label: t(STEP_LABELS[step]) })),
    [steps, t],
  );

  return <SharedStepper steps={items} currentIndex={stepIndex} />;
});

export default Stepper;
