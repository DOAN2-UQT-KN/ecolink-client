"use client";

import TagStatus from "./TagStatus";
import { cn } from "@/libs/utils";

export type StatusTagProps = {
  status: number | null | undefined;
  className?: string;
  /** Passed through to `TagStatus` for alternate copy on some states. */
  isBom?: boolean;
  /** Shown when `status` is null or undefined. */
  emptyLabel?: string;
};

/**
 * Read-only status label for tables and summaries. Backed by `TagStatus` (labels + antd colors).
 */
export function StatusTag({ status, className, isBom, emptyLabel = "—" }: StatusTagProps) {
  if (status == null) {
    return (
      <span className={cn("inline-block text-sm text-muted-foreground", className)}>{emptyLabel}</span>
    );
  }

  return <TagStatus type={status} className={className} isBom={isBom} />;
}

export default StatusTag;
