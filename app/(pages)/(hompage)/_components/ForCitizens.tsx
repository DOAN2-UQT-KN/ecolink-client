import { Tag } from "@/components/shared/Tag";
import { useMediaQuery } from "@/hooks/use-media-query";
import Image from "next/image";
import { Trans, useTranslation } from "react-i18next";

const MOBILE_IMG = "/take-action-desktop.png";
const DESKTOP_IMG = "/take-action-mobile.png";

const ForCitizens = () => {
  const { t } = useTranslation("common");
  const isLarge = useMediaQuery("(min-width: 1024px)");

  return <div className="flex flex-col"></div>;
};

export default ForCitizens;
