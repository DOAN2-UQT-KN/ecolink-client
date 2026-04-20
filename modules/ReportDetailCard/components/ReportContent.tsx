"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Image as AntdImage } from "antd";
import { HiMapPin } from "react-icons/hi2";
import { PiImagesSquareFill } from "react-icons/pi";
import { cn } from "@/libs/utils";

interface ReportContentProps {
  title: string | null;
  address: string | null;
  description: string | null;
  images?: string[];
  isExpanded?: boolean;
  /** Fired when Ant Design image preview opens or closes (true = preview visible). */
  onPreviewOpenChange?: (open: boolean) => void;
}

export const ReportContent = memo(function ReportContent({
  title,
  address,
  description,
  images = [],
  isExpanded = false,
  onPreviewOpenChange,
}: ReportContentProps) {
  /** Explicit z-index when expanded: preview portals to body and must sit above Radix Dialog (z-50); otherwise next/prev clicks hit the dialog. */
  const previewProps = useMemo(() => {
    const base =
      onPreviewOpenChange != null
        ? {
            onVisibleChange: (visible: boolean) => onPreviewOpenChange(visible),
          }
        : true;
    if (!isExpanded) return base;
    if (typeof base === "object") {
      return { ...base, zIndex: 2000 };
    }
    return { zIndex: 2000 };
  }, [isExpanded, onPreviewOpenChange]);
  /**
   * Stops Radix Dialog/Popover triggers on ancestors. Use bubble phase only — capture
   * stopPropagation on a parent blocks events from reaching Ant Design Image (preview breaks).
   */
  const stopDialogTrigger = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const imageInteractionShieldProps = {
    onClick: stopDialogTrigger,
    onPointerDown: stopDialogTrigger,
    onMouseDown: stopDialogTrigger,
  } as const;

  const renderImageGrid = useCallback(() => {
    if (images.length === 0) return null;

    if (isExpanded) {
      return (
        <AntdImage.PreviewGroup preview={previewProps}>
          <div
            className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide h-[200px]"
            {...imageInteractionShieldProps}
          >
            {images.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-64 aspect-video overflow-hidden rounded-lg bg-muted group cursor-pointer"
                {...imageInteractionShieldProps}
              >
                <AntdImage
                  src={img}
                  alt={title || ""}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                  width="100%"
                  height="100%"
                  preview={previewProps}
                />
                {idx === 2 && images.length > 3 && (
                  <div
                    className="absolute bottom-1.5 right-3 z-10 flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-1.5 text-white pointer-events-none"
                    aria-label={`${images.length - 3} more images`}
                  >
                    <PiImagesSquareFill className="size-3.5 shrink-0" />
                    <span className="text-[10px] font-medium leading-none tabular-nums">
                      +{images.length - 3}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {images.length > 3 && (
              <div className="hidden">
                {images.slice(3).map((hiddenImg, hIdx) => (
                  <AntdImage key={hIdx} src={hiddenImg} preview={previewProps} />
                ))}
              </div>
            )}
          </div>
        </AntdImage.PreviewGroup>
      );
    }

    return (
      <AntdImage.PreviewGroup preview={previewProps}>
        {images.length === 1 && (
          <div
            className="relative aspect-video w-full overflow-hidden bg-muted group cursor-pointer"
            {...imageInteractionShieldProps}
          >
            <AntdImage
              src={images[0]}
              alt={title || ""}
              className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
              width="100%"
              height="100%"
              preview={previewProps}
            />
          </div>
        )}

        {(images.length === 2 || images.length === 3) && (
          <div
            className="grid grid-cols-2 gap-2 aspect-[16/10] w-full overflow-hidden "
            {...imageInteractionShieldProps}
          >
            <div
              className="relative h-full overflow-hidden bg-muted group cursor-pointer"
              {...imageInteractionShieldProps}
            >
              <AntdImage
                src={images[0]}
                alt={title || ""}
                className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                width="100%"
                height="100%"
                preview={previewProps}
              />
            </div>
            <div className="relative h-full overflow-hidden bg-muted group cursor-pointer">
              <AntdImage
                src={images[1]}
                alt={title || ""}
                className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                width="100%"
                height="100%"
                preview={previewProps}
              />
              {images.length === 3 && (
                <>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] pointer-events-none z-10 transition-opacity group-hover:opacity-0">
                    <span className="text-white font-display-7">+1</span>
                  </div>
                  {/* Hidden image to be included in preview group */}
                  <div className="hidden">
                    <AntdImage src={images[2]} preview={previewProps} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {images.length >= 4 && (
          <div
            className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square w-full overflow-hidden "
            {...imageInteractionShieldProps}
          >
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative h-full overflow-hidden bg-muted group cursor-pointer"
                {...imageInteractionShieldProps}
              >
                <AntdImage
                  src={img}
                  alt={title || ""}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                  width="100%"
                  height="100%"
                  preview={previewProps}
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
                        <AntdImage key={hIdx} src={hiddenImg} preview={previewProps} />
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
  }, [images, isExpanded, previewProps, stopDialogTrigger, title]);


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
