"use client";

import { motion } from "framer-motion";

interface PageSuspenseProps {
  pageName: string;
}

const PageSuspense = ({ pageName }: PageSuspenseProps) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-primary">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for a "premium" feel
        }}
        className="text-center"
      >
        <span className="text-display-1 font-title font-medium tracking-tight text-background-quaternary lowercase">
          [{pageName}]
        </span>
      </motion.div>
    </div>
  );
};

export default PageSuspense;
