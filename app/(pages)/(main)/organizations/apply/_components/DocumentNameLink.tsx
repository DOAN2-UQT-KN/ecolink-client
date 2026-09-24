import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbExternalLink } from "react-icons/tb";

import { cn } from "@/libs/utils";

const linkClassName =
  "inline-flex max-w-full items-center gap-1 text-left text-button-accent underline-offset-4 hover:underline";

/**
 * A legal document's name that opens the file in a new tab. Pass `href` for a file already on
 * the server, or `onOpen` for one still in memory; with neither it renders as plain text.
 */
export const DocumentNameLink = memo(function DocumentNameLink({
  name,
  href,
  onOpen,
  className,
}: {
  name: string;
  href?: string;
  onOpen?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const label = t("Open in a new tab");
  const content = (
    <>
      <span className="truncate">{name}</span>
      <TbExternalLink className="size-3.5 shrink-0" aria-hidden />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className={cn(linkClassName, className)}
      >
        {content}
      </a>
    );
  }
  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={label}
        className={cn(linkClassName, "cursor-pointer", className)}
      >
        {content}
      </button>
    );
  }
  return <span className={cn("truncate", className)}>{name}</span>;
});

export default DocumentNameLink;
