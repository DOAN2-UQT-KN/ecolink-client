"use client";

import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/libs/utils";
import { AlignLeft } from "lucide-react";
import { HiMail } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import type { OrganizationCardSavePayload } from "./types/OrganizationCard.types";
import { useOrganizationCardEdit } from "./hooks/useOrganizationCardEdit";

export { useOrganizationCardEdit } from "./hooks/useOrganizationCardEdit";

export type { OrganizationCardSavePayload };

export interface OrganizationCardProps {
  name: string;
  description: string;
  logoUrl: string;
  backgroundUrl: string;
  contactEmail: string;
  className?: string;
  /** When true, fields become editable and a save action is shown. */
  editMode?: boolean;
  onSave?: (payload: OrganizationCardSavePayload) => void | Promise<void>;
  saveLabel?: string;
}

export const OrganizationCard = memo(function OrganizationCard({
  name,
  description,
  logoUrl,
  backgroundUrl,
  contactEmail,
  className,
  editMode = false,
  onSave,
  saveLabel = "Save",
}: OrganizationCardProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const draft = useOrganizationCardEdit({
    enabled: editMode,
    name,
    description,
    contactEmail,
    logoUrl,
    backgroundUrl,
  });

  const headerUrl = editMode ? draft.backgroundDisplayUrl : backgroundUrl;
  const logoDisplayUrl = editMode ? draft.logoDisplayUrl : logoUrl;

  const headerClassName = useMemo(
    () =>
      cn(
        "relative h-28 sm:h-32 w-full overflow-hidden rounded-t-[10px] bg-gradient-to-br from-button-accent/30 via-white/10 to-white/5",
        headerUrl && "bg-center bg-cover",
        editMode && "cursor-pointer group/cover",
      ),
    [headerUrl, editMode],
  );

  const headerStyle = useMemo(
    () =>
      headerUrl ? { backgroundImage: `url(${headerUrl})` } : undefined,
    [headerUrl],
  );

  const displayName = useMemo(() => {
    const raw = editMode ? draft.name : name;
    return raw.trim() ? raw : "—";
  }, [editMode, draft.name, name]);

  const displayDescription = useMemo(() => {
    const raw = editMode ? draft.description : description;
    return raw.trim() ? raw : "—";
  }, [editMode, draft.description, description]);

  const displayEmail = useMemo(() => {
    const raw = editMode ? draft.contactEmail : contactEmail;
    return raw.trim() ? raw : "—";
  }, [editMode, draft.contactEmail, contactEmail]);

  const emailHref = useMemo(() => {
    const raw = editMode ? draft.contactEmail : contactEmail;
    return raw.trim();
  }, [editMode, draft.contactEmail, contactEmail]);

  const openLogoPicker = useCallback(() => {
    logoInputRef.current?.click();
  }, []);

  const openBackgroundPicker = useCallback(() => {
    backgroundInputRef.current?.click();
  }, []);

  const onLogoInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      draft.onLogoFile(file);
      e.target.value = "";
    },
    [draft],
  );

  const onBackgroundInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      draft.onBackgroundFile(file);
      e.target.value = "";
    },
    [draft],
  );

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(draft.buildSavePayload());
    } finally {
      setIsSaving(false);
    }
  }, [draft, onSave]);

  return (
    <article
      className={cn(
        "flex flex-col w-full mx-auto border border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-hidden",
        className,
      )}
    >
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={onLogoInputChange}
      />
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={onBackgroundInputChange}
      />

      <button
        type="button"
        className={cn(
          "block w-full p-0 border-0 bg-transparent text-left",
          !editMode && "pointer-events-none cursor-default",
        )}
        onClick={editMode ? openBackgroundPicker : undefined}
        aria-label={editMode ? "Change cover image" : undefined}
        disabled={!editMode}
      >
        <div className={headerClassName} style={headerStyle}>
          {headerUrl ? (
            <div
              className={cn(
                "absolute inset-0 bg-black/25",
                editMode &&
                  "transition-colors group-hover/cover:bg-black/40",
              )}
              aria-hidden
            />
          ) : null}
        </div>
      </button>

      <div className="relative px-4 pb-4 pt-0 flex flex-col gap-3">
        <div className="flex flex-col items-center -mt-10 sm:-mt-11">
          <button
            type="button"
            className={cn(
              "relative z-10 size-20 sm:size-24 rounded-full border-2 border-white/90 bg-white shadow-md overflow-hidden flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-button-accent/50",
              !logoDisplayUrl && "bg-muted",
              editMode &&
                "cursor-pointer hover:ring-2 hover:ring-button-accent/30",
              !editMode && "pointer-events-none",
            )}
            onClick={editMode ? openLogoPicker : undefined}
            aria-label={editMode ? "Change logo" : undefined}
            disabled={!editMode}
          >
            {logoDisplayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary logo URLs
              <img
                src={logoDisplayUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground px-2 text-center">
                Logo
              </span>
            )}
          </button>
        </div>

        <div className="text-center space-y-1 pt-1">
          {editMode ? (
            <input
              type="text"
              value={draft.name}
              onChange={(e) => draft.setName(e.target.value)}
              className="w-full max-w-md mx-auto block text-center font-display-5 font-semibold text-foreground bg-transparent border-b border-dashed border-foreground/25 outline-none focus-visible:border-button-accent"
              aria-label="Organization name"
            />
          ) : (
            <h2 className="font-display-5 font-semibold text-foreground break-words">
              {displayName}
            </h2>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary break-words min-w-0">
            <HiMail
              className="size-4 shrink-0 text-button-accent mt-0.5"
              aria-hidden
            />
            <div className="text-center">
              {editMode ? (
                <input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => draft.setContactEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-dashed border-foreground-secondary/40 outline-none focus-visible:border-button-accent text-foreground-secondary placeholder:text-foreground-secondary/60 text-center"
                  placeholder="contact@example.com"
                  aria-label="Contact email"
                />
              ) : emailHref ? (
                <a
                  href={`mailto:${emailHref}`}
                  className="text-foreground-secondary hover:underline break-all"
                >
                  {displayEmail}
                </a>
              ) : (
                <p className="text-foreground-secondary">{displayEmail}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-center gap-2 rounded-lg border border-[rgba(136,122,71,0.35)] bg-white/40 px-3 py-2.5">
          <AlignLeft className="size-4 shrink-0 text-button-accent mt-0.5" />
          <div className="min-w-0 text-left w-full">
            <p className="text-xs font-medium text-foreground-tertiary">
              Description
            </p>
            {editMode ? (
              <textarea
                value={draft.description}
                onChange={(e) => draft.setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Organization description"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {displayDescription}
              </p>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              size="sm"
              disabled={isSaving || !onSave}
              onClick={handleSave}
            >
              {isSaving ? "…" : saveLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
});

export default OrganizationCard;
