"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";

const DEFAULT_MAX_LENGTH = 60;
const DEFAULT_MAX_WIDTH = "100%" as const;

export type TooltipTruncatedTextProps = {
  text: string | null | undefined;
  maxLength?: number;
  maxWidth?: number | string;
  className?: string;
};

export function TooltipTruncatedText({
  text,
  maxLength = DEFAULT_MAX_LENGTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  className,
}: TooltipTruncatedTextProps) {
  const value = text ?? "";
  const styleMaxWidth =
    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  if (!value) {
    return null;
  }

  const isTruncated = value.length > maxLength;
  const displayText = isTruncated
    ? `${value.slice(0, maxLength)}…`
    : value;

  const sharedClassName = cn(
    "block min-w-0 truncate text-left",
    isTruncated && "cursor-default",
    className,
  );

  if (!isTruncated) {
    return (
      <span className={sharedClassName} style={{ maxWidth: styleMaxWidth }}>
        {displayText}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={sharedClassName} style={{ maxWidth: styleMaxWidth }}>
          {displayText}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <p className="whitespace-pre-wrap break-words text-left">{value}</p>
      </TooltipContent>
    </Tooltip>
  );
}
