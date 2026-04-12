"use client";

import React, { memo, useMemo } from "react";
import { cn } from "@/libs/utils";
import { Mail } from "lucide-react";

export interface OrganizationCardProps {
  name: string;
  description: string;
  logoUrl: string;
  backgroundUrl: string;
  contactEmail: string;
  className?: string;
}

export const OrganizationCard = memo(function OrganizationCard({
  name,
  description,
  logoUrl,
  backgroundUrl,
  contactEmail,
  className,
}: OrganizationCardProps) {
  const headerClassName = useMemo(
    () =>
      cn(
        "relative h-28 sm:h-32 w-full overflow-hidden rounded-t-[10px] bg-gradient-to-br from-button-accent/30 via-white/10 to-white/5",
        backgroundUrl && "bg-center bg-cover",
      ),
    [backgroundUrl],
  );

  const headerStyle = useMemo(
    () =>
      backgroundUrl
        ? { backgroundImage: `url(${backgroundUrl})` }
        : undefined,
    [backgroundUrl],
  );

  const displayName = useMemo(
    () => (name.trim() ? name : "—"),
    [name],
  );

  const displayDescription = useMemo(
    () => (description.trim() ? description : "—"),
    [description],
  );

  const displayEmail = useMemo(
    () => (contactEmail.trim() ? contactEmail : "—"),
    [contactEmail],
  );

  return (
    <article
      className={cn(
        "flex flex-col w-full mx-auto border border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-hidden",
        className,
      )}
    >
      <div className={headerClassName} style={headerStyle}>
        {backgroundUrl ? (
          <div
            className="absolute inset-0 bg-black/25"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="relative px-4 pb-4 pt-0 flex flex-col gap-3">
        <div className="flex flex-col items-center -mt-10 sm:-mt-11">
          <div
            className={cn(
              "relative z-10 size-20 sm:size-24 rounded-xl border-2 border-white/90 bg-white shadow-md overflow-hidden flex items-center justify-center",
              !logoUrl && "bg-muted",
            )}
          >
            {logoUrl ? (
              // User-supplied URL; avoid next/image remotePatterns churn
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary logo URLs
              <img
                src={logoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground px-2 text-center">
                Logo
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-1 pt-1">
          <h2 className="font-display-5 font-semibold text-foreground break-words">
            {displayName}
          </h2>
          <p className="text-sm text-foreground-tertiary whitespace-pre-wrap break-words">
            {displayDescription}
          </p>
        </div>

        <div className="flex items-start justify-center gap-2 rounded-lg border border-[rgba(136,122,71,0.35)] bg-white/40 px-3 py-2.5">
          <Mail className="size-4 shrink-0 text-button-accent mt-0.5" />
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium text-foreground-tertiary">
              Contact
            </p>
            {contactEmail.trim() ? (
              <a
                href={`mailto:${contactEmail.trim()}`}
                className="text-sm text-button-accent hover:underline break-all"
              >
                {displayEmail}
              </a>
            ) : (
              <p className="text-sm text-foreground break-all">{displayEmail}</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

export default OrganizationCard;
