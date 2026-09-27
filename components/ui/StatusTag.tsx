import TagStatus from "./TagStatus";
import { cn } from "@/libs/utils";

export type StatusTagProps = {
  status: number | null | undefined;
  className?: string;
  /** Shown when `status` is null or undefined. */
  emptyLabel?: string;
  /** Override the default status label. */
  label?: string;
  isDark?: boolean;
};

/**
 * Read-only status label for tables and summaries. Backed by `TagStatus` (a `Pill`).
 */
export function StatusTag({ status, className, emptyLabel = "—", label, isDark }: StatusTagProps) {
  if (status == null) {
    return (
      <span className={cn("inline-block text-sm text-muted-foreground", className)}>{emptyLabel}</span>
    );
  }

  return <TagStatus type={status} className={className} label={label} isDark={isDark} />;
}

export default StatusTag;
