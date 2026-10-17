import { useState } from "react";
import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import type { IIncident } from "@/apis/incident/models/incident";
import { Skeleton } from "@/components/ui/skeleton";

const firstImage = (r?: IIncident) => r?.image_urls?.[0] ?? r?.media_files?.[0]?.url;

/**
 * The owner's photo next to the similar report's (specs/010 US3). Only the photo of the other
 * report is used, never its sender (FR-019).
 * shortcut: evidence has no matched image id, so this compares each report's first photo; upgrade
 * when the duplicate check stores the matched media.
 */
export default function DuplicatePhotos({
  own,
  similar,
  similarCode,
  isLoading,
  isError,
}: {
  own: IIncident;
  similar?: IIncident;
  similarCode: string;
  isLoading: boolean;
  isError: boolean;
}) {
  const { t } = useTranslation();
  const placeholder = (text: string) => (
    <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted p-2 text-center text-xs text-foreground-tertiary">
      {text}
    </div>
  );
  const tile = (url: string | undefined, alt: string, caption: string, fallback: React.ReactNode) => (
    <figure className="flex min-w-0 flex-col gap-1.5">
      {url ? (
        <AntdImage src={url} alt={alt} rootClassName="w-full" className="aspect-square w-full rounded-md object-cover" />
      ) : (
        fallback
      )}
      <figcaption className="truncate text-xs text-foreground-tertiary">{caption}</figcaption>
    </figure>
  );
  const similarLabel = t("Similar report {{code}}", { code: similarCode });

  return (
    <div className="grid grid-cols-2 gap-3">
      <AntdImage.PreviewGroup>
        {tile(firstImage(own), t("Your report"), t("Your report"), placeholder(t("No photo")))}
        {tile(
          isLoading || isError ? undefined : firstImage(similar),
          similarLabel,
          similarLabel,
          isLoading ? (
            <Skeleton className="aspect-square w-full rounded-md" />
          ) : (
            placeholder(isError ? t("Could not view the similar report") : t("No photo"))
          ),
        )}
      </AntdImage.PreviewGroup>
    </div>
  );
}

/**
 * The owner's photo next to the image found on the web (specs/011). A broken web image falls back
 * to a placeholder; the page link lives in the issue card.
 * shortcut: the zoomed preview may load the web image without no-referrer.
 */
export function WebPhotos({ own, imageIndex, sourceUrl, caption }: {
  own: IIncident;
  imageIndex: number;
  sourceUrl: string;
  caption: string;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const ownUrl = own.image_urls?.[imageIndex] ?? own.media_files?.[imageIndex]?.url ?? firstImage(own);
  const placeholder = (text: string) => (
    <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted p-2 text-center text-xs text-foreground-tertiary">
      {text}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <AntdImage.PreviewGroup>
        <figure className="flex min-w-0 flex-col gap-1.5">
          {ownUrl ? (
            <AntdImage src={ownUrl} alt={t("Your report")} rootClassName="w-full" className="aspect-square w-full rounded-md object-cover" />
          ) : (
            placeholder(t("No photo"))
          )}
          <figcaption className="truncate text-xs text-foreground-tertiary">{t("Your report")}</figcaption>
        </figure>
        <figure className="flex min-w-0 flex-col gap-1.5">
          {failed ? (
            placeholder(t("Could not load image"))
          ) : (
            <AntdImage
              src={sourceUrl}
              alt={t("Image found on the web")}
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              rootClassName="w-full"
              className="aspect-square w-full rounded-md object-cover"
            />
          )}
          <figcaption className="truncate text-xs text-foreground-tertiary">{caption}</figcaption>
        </figure>
      </AntdImage.PreviewGroup>
    </div>
  );
}
