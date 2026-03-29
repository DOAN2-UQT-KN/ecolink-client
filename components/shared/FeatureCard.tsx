"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import Image from "next/image";
import React from "react";

export type FeatureCardProps = {
  imageSrc: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  shadowColor?: string;
  bgColor?: string;
  flexDirection?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  button?: React.ReactNode;
  className?: string; // Add className prop here
};

const FeatureCard = ({
  imageSrc,
  imageAlt = "Item Content Image",
  imageWidth,
  imageHeight,
  imageClassName = "w-[130px] lg:h-[230px] h-auto",
  shadowColor = "shadow-[0_2px_6px_rgba(25,33,61,0.14)]",
  bgColor = "bg-[#887A47]/20",
  flexDirection = "flex-col",
  title,
  description,
  button,
  className = "", // Default to empty string
}: FeatureCardProps) => {
  const isMedium = useMediaQuery("(min-width: 768px)");

  const resolvedImageWidth = imageWidth ?? (isMedium ? 230 : 133);
  const resolvedImageHeight = imageHeight ?? (isMedium ? 230 : 133);

  return (
    <div
      className={`flex ${flexDirection} items-center justify-between px-[25px] py-[25px] gap-3 md:gap-0 rounded-[40px] w-full ${bgColor} ${shadowColor} ${className}`}
    >
      {!isMedium && (
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={resolvedImageWidth}
          height={resolvedImageHeight}
          className={imageClassName}
        />
      )}

      <div className="flex flex-col gap-[10px]">
        <span className="font-display-3 font-bold text-black">{title}</span>
        <span className="font-display-1 text-foreground-secondary">
          {description}
        </span>
      </div>

      {button && (
        <div className="flex items-center justify-center">{button}</div>
      )}

      {isMedium && (
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={resolvedImageWidth}
          height={resolvedImageHeight}
          className={imageClassName}
        />
      )}
    </div>
  );
};

export default FeatureCard;
