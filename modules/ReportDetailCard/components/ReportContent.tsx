"use client";

import React, { memo, useCallback } from "react";
import { Image as AntdImage } from "antd";
import { HiMapPin } from "react-icons/hi2";
import { cn } from "@/libs/utils";

interface ReportContentProps {
  title: string | null;
  address: string | null;
  description: string | null;
  images?: string[];
  isExpanded?: boolean;
}

export const ReportContent = memo(function ReportContent({
  title,
  address,
  description,
  images = [],
  isExpanded = false,
}: ReportContentProps) {
  const renderImageGrid = useCallback(() => {
    if (images.length === 0) return null;

    if (isExpanded) {
      return (
        <AntdImage.PreviewGroup>
          <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide h-[200px]">
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-64 aspect-video overflow-hidden rounded-lg bg-muted group cursor-pointer"
              >
                <AntdImage
                  src={img}
                  alt={title || ""}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                  width="100%"
                  height="100%"
                />
              </div>
            ))}
          </div>
        </AntdImage.PreviewGroup>
      );
    }

    return (
      <AntdImage.PreviewGroup>
        {images.length === 1 && (
          <div className="relative aspect-video w-full overflow-hidden bg-muted group cursor-pointer">
            <AntdImage
              src={images[0]}
              alt={title || ""}
              className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
              width="100%"
              height="100%"
            />
          </div>
        )}

        {(images.length === 2 || images.length === 3) && (
          <div className="grid grid-cols-2 gap-2 aspect-[16/10] w-full overflow-hidden ">
            <div className="relative h-full overflow-hidden bg-muted group cursor-pointer">
              <AntdImage
                src={images[0]}
                alt={title || ""}
                className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                width="100%"
                height="100%"
              />
            </div>
            <div className="relative h-full overflow-hidden bg-muted group cursor-pointer">
              <AntdImage
                src={images[1]}
                alt={title || ""}
                className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                width="100%"
                height="100%"
              />
              {images.length === 3 && (
                <>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] pointer-events-none z-10 transition-opacity group-hover:opacity-0">
                    <span className="text-white font-display-7">+1</span>
                  </div>
                  {/* Hidden image to be included in preview group */}
                  <div className="hidden">
                    <AntdImage src={images[2]} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {images.length >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square w-full overflow-hidden ">
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative h-full overflow-hidden bg-muted group cursor-pointer"
              >
                <AntdImage
                  src={img}
                  alt={title || ""}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                  width="100%"
                  height="100%"
                />
                {idx === 3 && images.length > 4 && (
                  <>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] pointer-events-none z-10 transition-opacity group-hover:opacity-0">
                      <span className="text-white font-display-7">
                        +{images.length - 4}
                      </span>
                    </div>
                    {/* Remaining hidden images for preview group */}
                    <div className="hidden">
                      {images.slice(4).map((hiddenImg, hIdx) => (
                        <AntdImage key={hIdx} src={hiddenImg} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </AntdImage.PreviewGroup>
    );
  }, [images, isExpanded, title]);


  return (
    <div className={cn("flex flex-col gap-4", isExpanded && "gap-6")}>
      <div className="space-y-1">
        <h2 className="font-display-4 font-semibold text-black leading-tight">
          {title}
        </h2>
        {address && (
          <div className="flex items-center gap-2 font-display-1 text-foreground-tertiary">
            <HiMapPin size={14} />
            <p>{address}</p>
          </div>
        )}
      </div>
      {description && (
        <p
          className={cn(
            "font-display-2 text-foreground-secondary leading-relaxed transition-all duration-300",
            !isExpanded && "line-clamp-3 hover:line-clamp-none",
          )}
        >
          {description}
        </p>
      )}
      {renderImageGrid()}
    </div>
  );
});
