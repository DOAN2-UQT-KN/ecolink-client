import { Tag } from "@/components/shared/Tag";
import { useMediaQuery } from "@/hooks/use-media-query";
import Image from "next/image";
import { Trans, useTranslation } from "react-i18next";

const MOBILE_IMG = "/take-action-desktop.png";
const DESKTOP_IMG = "/take-action-mobile.png";

const ForVolunteer = () => {
  const { t } = useTranslation("common");
  const isLarge = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center">
        <Tag variant="green">Smart Environmental System</Tag>

        <h1 className="text-center">
          <Trans
            ns="common"
            i18nKey="forVolunteers"
            components={[
              <span
                key="0"
                className="text-background-quaternary italic whitespace-nowrap"
              />,
              <br key="1" />,
            ]}
          />
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between">
        <Image
          src={isLarge ? DESKTOP_IMG : MOBILE_IMG}
          alt="For volunteers"
          width={isLarge ? 572 : 393}
          height={isLarge ? 582 : 378}
        />
      </div>
    </div>
  );
};

export default ForVolunteer;
