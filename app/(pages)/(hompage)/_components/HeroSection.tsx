"use client";

import { Button } from "@/components/shared/Button";
import { Divider } from "@/components/shared/Divider";
import { Tag } from "@/components/shared/Tag";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col lg:flex-row items-center justify-between w-full px-[20px] lg:px-[160px] ">
      <Image
        src="/herosection.png"
        alt="Hero Image"
        width={368}
        height={282}
        className="lg:hidden"
      />

      <div className="flex flex-col items-center lg:items-start justify-between lg:w-[617px] 3xl:!w-[800px] gap-[17px] lg:gap-6">
        <Tag variant="green">EcoLink Platform</Tag>

        <div className="w-fit">
          <h1 className="w-fit text-center lg:text-left">
            <span>{t("Link for a")}</span>{" "}
            <span className="text-background-quaternary italic whitespace-nowrap">
              {t("Cleaner Tomorrow")}
            </span>
          </h1>
          <Divider className="text-background-tertiary my-5" />
        </div>

        <p className="font-display-2 text-center lg:text-left lg:font-display-3 3xl:!font-display-4">
          {t(
            "Join a community that turns environmental responsibility into real-world action through collective trash collection.",
          )}
        </p>

        <div className="flex flex-row gap-[10px]">
          <Button variant="green">{t("Join now")}</Button>
          <Button variant="outlined-green">{t("Explore more")}</Button>
        </div>
      </div>

      <Image
        src="/herosection.png"
        alt="Hero Image"
        width={800}
        height={618}
        className="hidden 3xl:block"
      />

      <Image
        src="/herosection.png"
        alt="Hero Image"
        width={600}
        height={418}
        className="hidden lg:block 3xl:!hidden"
      />
    </section>
  );
};

export default HeroSection;
