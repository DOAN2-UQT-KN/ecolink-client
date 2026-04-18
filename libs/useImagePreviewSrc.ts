"use client";

/* Blob previews need createObjectURL + revoke tied to `source`; setState in layout effect runs before paint. */
/* eslint-disable react-hooks/set-state-in-effect -- intentional: sync blob URL with form field without stale revoke */
import { useLayoutEffect, useState } from "react";

/** True for RHF-stored Blobs even if `instanceof Blob` is false across realms. */
export function isBlobLike(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Blob;
  return (
    typeof b.size === "number" &&
    typeof b.slice === "function" &&
    typeof b.arrayBuffer === "function"
  );
}

/**
 * Returns a value safe for `img src` / `url(...)`: remote URLs, data URLs, or a
 * managed `blob:` URL for Blob/File form values (revoked when `source` changes
 * or the component unmounts).
 */
export function useImagePreviewSrc(source: unknown): string {
  const [blobUrl, setBlobUrl] = useState("");

  const isEmpty = source === "" || source == null;

  useLayoutEffect(() => {
    if (isEmpty || typeof source === "string") {
      setBlobUrl("");
      return undefined;
    }
    if (!isBlobLike(source)) {
      setBlobUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(source);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isEmpty, source]);

  if (isEmpty) return "";
  if (typeof source === "string") return source;
  return blobUrl;
}
