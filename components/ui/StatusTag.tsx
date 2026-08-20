import TagStatus from "./TagStatus";
import { cn } from "@/libs/utils";

export type StatusTagProps = {
  status: number | null | undefined;
  className?: string;
  /** Shown when `status` is null or undefined. */
  emptyLabel?: string;
  /** Override the default status label. */
  label?: string;
};

/**
 * Read-only status label for tables and summaries. Backed by `TagStatus` (labels + antd colors).
 */
export function StatusTag({ status, className, emptyLabel = "—", label }: StatusTagProps) {
  if (status == null) {
    return (
      <span className={cn("inline-block text-sm text-muted-foreground", className)}>{emptyLabel}</span>
    );
  }

  return <TagStatus type={status} className={className} label={label} />;
}

export default StatusTag;
