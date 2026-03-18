import { Button } from "@/components/shared/Button";
import { Tag } from "@/components/shared/Tag";
import FeatureCard from "@/components/shared/FeatureCard";
import { Trans, useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

const ForCitizens = () => {
  const { t } = useTranslation("common");
  const isMedium = useMediaQuery("(min-width: 768px)");
  const forCitizensItems = useMemo(
    () => [
      {
        key: "report-trash",
        imageSrc: "/report-trash.png",
        title: t("Report Waste"),
        description: t(
          "Take a photo and submit the waste location in just a few steps.",
        ),
        button: (
          <Button variant="brown" className="w-full" onClick={() => {}}>
            {t("Try Now")}
          </Button>
        ),
        imageWidth: isMedium ? 230 : 130,
        imageHeight: isMedium ? 230 : 130,
        imageClassName: "w-[130px] md:w-[230px] h-auto",
      },
      {
        key: "track-progress",
        imageSrc: "/track-progress.png",
        title: t("Track Progress"),
        description: t(
          "Track the cleanup status in real time directly on the map.",
        ),
        imageWidth: 163,
        imageHeight: 171,
        imageClassName: "w-[163px] h-[171px]",
        flexDirection: isMedium ? "flex-row" : "flex-col",
        bgColor: "bg-[#C5D89D]/50",
      },
      {
        key: "support-movement",
        imageSrc: "/support-movement.png",
        title: t("Support the Movement"),
        description: t(
          "Share reports and cleanup results to raise community awareness.",
        ),
        imageWidth: isMedium ? 247 : 233,
        imageHeight: isMedium ? 162 : 153,
        imageClassName: "w-[233px] h-[153px] md:w-[247px] md:h-[162px]",
        bgColor: "white",
      },
    ],
    [t, isMedium],
  );

  return (
    <div className="flex flex-col px-[10px] w-full lg:pl-[160px] lg:pr-[120px] lg:flex-row md:items-start md:justify-center md:gap-[50px] ">
      <div className="flex flex-col items-center gap-5 pb-5 md:items-start">
        <Tag variant="green">Raise Your Voice</Tag>

        <h1 className="text-center lg:text-left">
          <Trans
            ns="common"
            i18nKey="forCitizens"
            components={[
              <span
                key="0"
                className="text-background-quaternary italic whitespace-nowrap"
              />,
              <br key="1" className="hidden lg:inline" />,
            ]}
          />
        </h1>

        <p className="text-justify font-display-2 text-foreground-secondary  lg:w-[600px] md:w-[300px]">
          {t(
            "Report waste and environmental issues in just a few simple steps. Your voice empowers the community to act faster and create meaningful change for the Earth.",
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between w-full gap-[30px] px-[20px] py-[10px] lg:w-3/4 w-full">
        <FeatureCard {...forCitizensItems[0]} />
        <div className="flex flex-col gap-[30px] w-full">
          <FeatureCard {...forCitizensItems[1]} />
          <FeatureCard {...forCitizensItems[2]} />
        </div>
      </div>
    </div>
  );
};

export default ForCitizens;
