import React, { memo, useCallback } from "react";
import { Image as AntdImage } from "antd";
import { HiMapPin } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportContentProps {
  title: string | null;
  /** Report detail page; when set the title is a link to it. */
  href?: string;
  address: string | null;
  description: string | null;
  /** AI recommendation in markdown. */
  aiRecommendation?: string | null;
  images?: string[];
  isExpanded?: boolean;
}

export const ReportContent = memo(function ReportContent({
  title,
  href,
  address,
  description,
  aiRecommendation,
  images = [],
  isExpanded = false,
}: ReportContentProps) {
  const { t } = useTranslation();
  const previewProps = true;
  /**
   * Keeps image clicks from reaching the card's own click (it opens the report page). Use bubble
   * phase only — capture stopPropagation on a parent blocks events from reaching Ant Design Image.
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
    // 3 columns, at most 2 rows; past 6 photos the last tile shows "+N" (the rest stay in the preview).
    const shown = images.slice(0, 6);
    const extra = images.length - shown.length;

    return (
      <AntdImage.PreviewGroup preview={previewProps}>
        <div
          className="grid w-full max-w-3xl grid-cols-3 gap-1 overflow-hidden rounded-lg"
          {...imageInteractionShieldProps}
        >
          {shown.map((img, idx) => (
            <div
              key={idx}
              className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
              {...imageInteractionShieldProps}
            >
              <AntdImage
                src={img}
                alt={title || ""}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                width="100%"
                height="100%"
                preview={previewProps}
              />
              {idx === shown.length - 1 && extra > 0 && (
                <>
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px] transition-opacity group-hover:opacity-0">
                    <span className="font-display-7 text-white">+{extra}</span>
                  </div>
                  <div className="hidden">
                    {images.slice(shown.length).map((hiddenImg, hIdx) => (
                      <AntdImage key={hIdx} src={hiddenImg} preview={previewProps} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </AntdImage.PreviewGroup>
    );
  }, [images, stopDialogTrigger, title]);


  return (
    <div className={cn("flex flex-col gap-4")}>
      <div className="space-y-1">
        <h2 className="font-display-4 font-semibold text-black leading-tight">
          {href ? (
            <Link href={href} className="hover:underline focus-visible:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {address && (
          <div className="flex items-center gap-2 font-display-1 text-foreground-tertiary">
            <HiMapPin size={14} />
            <p>{address}</p>
          </div>
        )}
      </div>
      <RichTextContent
        value={description}
        className={cn(
          "font-display-2 text-foreground-secondary leading-relaxed transition-all duration-300",
        )}
        maxLines={isExpanded ? undefined : 3}
        showMoreLabel={t("Show more")}
        showLessLabel={t("Show less")}
      />

      {isExpanded && aiRecommendation ? (
        <section className="rounded-lg border border-border/60 bg-white/70 p-4">
          <h3 className="font-display-3 font-semibold text-black mb-2">
            AI recommendation
          </h3>
          <div className="prose prose-sm max-w-none text-foreground-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiRecommendation}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}

      {renderImageGrid()}
    </div>
  );
});
