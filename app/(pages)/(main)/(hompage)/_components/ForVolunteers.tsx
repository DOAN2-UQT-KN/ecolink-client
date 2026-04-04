"use client";

import CollapseCard from "@/components/shared/CollapseCard";
import { Tag } from "@/components/shared/Tag";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Image from "next/image";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const MOBILE_IMG = "/take-action-mobile.png";
const DESKTOP_IMG = "/take-action-desktop.png";

const volunteerItems = [
  {
    key: "find-waste-locations",
    title: "Find Waste Locations",
    description:
      "View real-time waste locations on the map and identify areas that need action. Clear visual data helps you quickly choose where to make an impact.",
  },
  {
    key: "join-the-cleanup",
    title: "Join the Cleanup",
    description:
      "Sign up and join the community to clean the selected area. Every action directly contributes to a cleaner and healthier environment.",
  },
  {
    key: "capture-the-impact",
    title: "Capture the Impact",
    description:
      "Capture photos after completion to verify and share the positive results. Your impact not only cleans the area but also inspires others to take action.",
  },
];

const ForVolunteer = () => {
  const { t } = useTranslation("common");
  const isLarge = useMediaQuery("(min-width: 1024px)");

  const renderVolunteerItems = useCallback(() => {
    return volunteerItems.map((item) => (
      <CollapseCard
        key={item.key}
        title={t(item.title)}
        className="h-full"
        defaultOpen
      >
        <p>{t(item.description)}</p>
      </CollapseCard>
    ));
  }, [t]);

  return (
    <section className="flex flex-col w-full  ">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-5 pb-5"
      >
        <Tag variant="green">Take Action</Tag>

        <h1 className="text-center">
          <Trans
            ns="common"
            i18nKey="forVolunteers"
            components={[
              <span
                key="0"
                className="text-background-quaternary italic whitespace-nowrap"
              />,
              <br key="1" className="lg:hidden inline" />,
            ]}
          />
        </h1>
      </motion.div>

      <div className="flex flex-col lg:flex-row items-center justify-between w-full lg:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src={isLarge ? DESKTOP_IMG : MOBILE_IMG}
            alt="For volunteers"
            width={isLarge ? 572 : 393}
            height={isLarge ? 582 : 378}
            className="w-[393px] lg:w-[572px] h-auto"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col px-[10px] gap-3 w-full"
        >
          {renderVolunteerItems()}
        </motion.div>
      </div>
    </section>
  );
};

export default ForVolunteer;
