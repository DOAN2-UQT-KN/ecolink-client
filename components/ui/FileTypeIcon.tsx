import { memo } from "react";
import type { IconType } from "react-icons";
import {
  TbFile,
  TbFileTypeJpg,
  TbFileTypePdf,
  TbFileTypePng,
  TbPhoto,
} from "react-icons/tb";

import { cn } from "@/libs/utils";

const PDF = { icon: TbFileTypePdf, tone: "text-red-500" };
const JPG = { icon: TbFileTypeJpg, tone: "text-sky-600" };
const PNG = { icon: TbFileTypePng, tone: "text-sky-600" };
const IMAGE = { icon: TbPhoto, tone: "text-sky-600" };
const OTHER = { icon: TbFile, tone: "" };

function resolve(
  mimeType?: string | null,
  fileName?: string | null,
): { icon: IconType; tone: string } {
  const mime = mimeType?.toLowerCase().trim() ?? "";
  if (mime === "application/pdf") return PDF;
  if (mime === "image/jpeg" || mime === "image/jpg") return JPG;
  if (mime === "image/png") return PNG;
  if (mime.startsWith("image/")) return IMAGE;

  // No MIME type (or an unexpected one): fall back to the extension.
  const extension = fileName?.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return PDF;
  if (extension === "jpg" || extension === "jpeg") return JPG;
  if (extension === "png") return PNG;
  return OTHER;
}

/**
 * Icon for a stored file, picked from its MIME type (or its extension when that is all we
 * have). Decorative: the file name next to it already says what it is.
 */
export const FileTypeIcon = memo(function FileTypeIcon({
  mimeType,
  fileName,
  className,
}: {
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
}) {
  const { icon: Icon, tone } = resolve(mimeType, fileName);
  return <Icon aria-hidden className={cn("size-5 shrink-0", tone, className)} />;
});

export default FileTypeIcon;
