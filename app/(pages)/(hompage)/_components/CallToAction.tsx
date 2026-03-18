import { Button } from "@/components/shared/Button";
import { Trans, useTranslation } from "react-i18next";

const CallToAction = () => {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-between gap-[30px]  px-[30px]">
      <span className="font-title text-[30px] md:text-[60px] text-center">
        <Trans
          ns="common"
          i18nKey="callToAction"
          components={[
            <span
              key="0"
              className="text-background-quaternary italic whitespace-nowrap"
            />,
            <br key="1" className="lg:hidden inline" />,
          ]}
        />
      </span>

      <p className="flex flex-col items-center font-display-2 text-foreground-secondary text-center">
        <span>
          {t(
            "Join the movement to report, clean, and protect our environment.",
          )}
        </span>
        <span className="hidden md:block">
          {t(
            "Every small action you take creates a cleaner, more sustainable future.",
          )}
        </span>
      </p>

      <Button variant="green">{t("Join EcoLink")}</Button>
    </div>
  );
};

export default CallToAction;
