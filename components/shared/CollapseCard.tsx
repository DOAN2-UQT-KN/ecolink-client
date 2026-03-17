"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useMediaQuery } from "@/hooks/use-media-query";

type CollapseCardProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  maxLineVisible?: number | { mobile: number; desktop: number };
};

export default function CollapseCard({
  title,
  children,
  defaultOpen = false,
  className,
  maxLineVisible = { mobile: 2, desktop: 3 },
}: CollapseCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isLarge = useMediaQuery("(min-width: 1024px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mLine =
    typeof maxLineVisible === "number" ? maxLineVisible : maxLineVisible.mobile;
  const dLine =
    typeof maxLineVisible === "number"
      ? maxLineVisible
      : maxLineVisible.desktop;

  const currentLines = mounted && isLarge ? dLine : mLine;

  return (
    <div
      className={clsx(
        " transition border-b-3 border-background-quaternary",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-2 text-left gap-4"
      >
        <div
          className="font-bold font-display-4 flex-1"
          style={
            currentLines
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: currentLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }
              : undefined
          }
        >
          {title}
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="mt-1 flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className=" pb-4 text-foreground-secondary font-display-2 md:font-display-3 text-justify">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
