"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { OrganizationCardSavePayload } from "../types/OrganizationCard.types";

function revokeIfBlob(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

type LogoState =
  | { kind: "url"; displayUrl: string }
  | { kind: "file"; file: File; displayUrl: string };

type BackgroundState =
  | { kind: "url"; displayUrl: string }
  | { kind: "file"; file: File; displayUrl: string };

export interface UseOrganizationCardEditArgs {
  enabled: boolean;
  name: string;
  description: string;
  contactEmail: string;
  logoUrl: string;
  backgroundUrl: string;
}

export function useOrganizationCardEdit({
  enabled,
  name: nameProp,
  description: descriptionProp,
  contactEmail: contactEmailProp,
  logoUrl,
  backgroundUrl,
}: UseOrganizationCardEditArgs) {
  const [name, setName] = useState(nameProp);
  const [description, setDescription] = useState(descriptionProp);
  const [contactEmail, setContactEmail] = useState(contactEmailProp);
  const [logo, setLogo] = useState<LogoState>({
    kind: "url",
    displayUrl: logoUrl,
  });
  const [background, setBackground] = useState<BackgroundState>({
    kind: "url",
    displayUrl: backgroundUrl,
  });

  const prevBlobRef = useRef<{ logo: string | null; bg: string | null }>({
    logo: null,
    bg: null,
  });

  const replaceLogoBlob = useCallback((next: LogoState) => {
    revokeIfBlob(prevBlobRef.current.logo);
    prevBlobRef.current.logo =
      next.kind === "file" ? next.displayUrl : null;
    setLogo(next);
  }, []);

  const replaceBackgroundBlob = useCallback((next: BackgroundState) => {
    revokeIfBlob(prevBlobRef.current.bg);
    prevBlobRef.current.bg =
      next.kind === "file" ? next.displayUrl : null;
    setBackground(next);
  }, []);

  const prevEnabledRef = useRef(false);
  useEffect(() => {
    const justEnabled = enabled && !prevEnabledRef.current;
    prevEnabledRef.current = enabled;
    if (!justEnabled) return;
    setName(nameProp);
    setDescription(descriptionProp);
    setContactEmail(contactEmailProp);
    replaceLogoBlob({ kind: "url", displayUrl: logoUrl });
    replaceBackgroundBlob({ kind: "url", displayUrl: backgroundUrl });
  }, [
    enabled,
    nameProp,
    descriptionProp,
    contactEmailProp,
    logoUrl,
    backgroundUrl,
    replaceLogoBlob,
    replaceBackgroundBlob,
  ]);

  useEffect(() => {
    return () => {
      revokeIfBlob(prevBlobRef.current.logo);
      revokeIfBlob(prevBlobRef.current.bg);
    };
  }, []);

  const onLogoFile = useCallback((file: File | null) => {
    if (!file) return;
    const displayUrl = URL.createObjectURL(file);
    replaceLogoBlob({ kind: "file", file, displayUrl });
  }, [replaceLogoBlob]);

  const onBackgroundFile = useCallback((file: File | null) => {
    if (!file) return;
    const displayUrl = URL.createObjectURL(file);
    replaceBackgroundBlob({ kind: "file", file, displayUrl });
  }, [replaceBackgroundBlob]);

  const buildSavePayload = useCallback((): OrganizationCardSavePayload => {
    return {
      name: name.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim(),
      logo: logo.kind === "file" ? { file: logo.file } : { unchanged: true },
      background:
        background.kind === "file"
          ? { file: background.file }
          : { unchanged: true },
    };
  }, [name, description, contactEmail, logo, background]);

  return {
    name,
    setName,
    description,
    setDescription,
    contactEmail,
    setContactEmail,
    logoDisplayUrl: logo.displayUrl,
    backgroundDisplayUrl: background.displayUrl,
    onLogoFile,
    onBackgroundFile,
    buildSavePayload,
  };
}
