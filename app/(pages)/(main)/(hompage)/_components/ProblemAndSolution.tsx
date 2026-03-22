"use client";

import { Tag } from "@/components/shared/Tag";
import { Trans, useTranslation } from "react-i18next";
import ContentCard from "@/components/shared/ContentCard";
import { useCallback } from "react";
import { motion } from "framer-motion";

const solutionItems = [
  {
    key: "trash-detector",
    image: "/trash-detector.webp",
    title: "Smart Waste Detection",
    description:
      "Automatically classifies and assesses pollution levels from photos using Deep Learning models. This technology streamlines the reporting process and ensures environmental data accuracy.",
  },
  {
    key: "connecting-green-community",
    image: "/collect-trash.jpg",
    title: "Connecting Green Community",
    description:
      "We connect volunteers to clean polluted areas, turning awareness into real action. Each activity improves local environments while fostering shared responsibility. Collective effort drives sustainable impact.",
  },
  {
    key: "real-time-waste-map",
    image: "/map.jpg",
    title: "Real-Time Waste Map",
    description:
      "The map displays waste locations in real time, enabling quick monitoring and prioritization. Continuously updated data ensures accuracy and optimized routes. A smarter and more strategic cleanup approach.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const ProblemAndSolution = () => {
  const { t } = useTranslation("common");

  const renderSolutionItem = useCallback(() => {
    return solutionItems.map((item) => (
      <motion.div key={item.key} variants={itemVariants} className="h-full w-full flex justify-center">
        <ContentCard
          title={item.title}
          description={item.description}
          image={item.image}
          className="h-full w-full"
        />
      </motion.div>
    ));
  }, [t]);

  return (
    <div className="flex flex-col items-center justify-between py-[40px] px-[10px] lg:px-[120px] gap-10 w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-5 "
      >
        <Tag variant="green">Smart Environmental System</Tag>

        <h1 className="text-center">
          <Trans
            ns="common"
            i18nKey="ourSolutions"
            components={[
              <span
                key="0"
                className="text-background-quaternary italic whitespace-nowrap"
              />,
              <br key="1" className="inline lg:hidden" />,
            ]}
          />
        </h1>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col items-center gap-[35px] lg:grid lg:grid-cols-3 lg:w-full lg:gap-[30px] lg:justify-items-center"
      >
        {renderSolutionItem()}
      </motion.div>
    </div>
  );
};

export default ProblemAndSolution;
