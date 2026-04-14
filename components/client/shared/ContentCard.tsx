"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export type ContentCardProps = {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  tags?: string[];

  variant?: "default" | "featured" | "compact";
  size?: "sm" | "md" | "lg";

  showImage?: boolean;
  showDescription?: boolean;

  loading?: boolean;
  href?: string;

  onClick?: () => void;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;

  className?: string;
  children?: React.ReactNode;
};

const ContentCard = ({
  title,
  description,
  image,
  onClick,
  className = "",
  showImage = true,
  showDescription = true,
  children,
}: ContentCardProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(
          textRef.current.scrollHeight > textRef.current.clientHeight,
        );
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [description]);

  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-between w-[278px]  md:w-[327px] ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-[10px] flex-grow ">
        {showImage && image && (
          <div className="relative shrink-0 w-[278px] h-[238px] md:w-[327px] overflow-hidden">
            <Image src={image} alt={title} fill className="object-cover" />
          </div>
        )}
        <h3 className="font-display-4 font-bold">{t(title)}</h3>

        {showDescription && description && (
          <div>
            <p
              ref={textRef}
              className={`font-display-1 lg:font-display-2 text-foreground-secondary ${!isExpanded ? "line-clamp-2 md:line-clamp-4" : ""}`}
            >
              {t(description)}
            </p>
            {isOverflowing && !isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="font-display-1 lg:font-display- mt-1 font-medium text-foreground underline decoration-1 underline-offset-2"
              >
                {t("See more")}
              </button>
            )}
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="font-display-1 mt-1 font-medium text-foreground underline decoration-1 underline-offset-2"
              >
                {t("See less")}
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ContentCard;
