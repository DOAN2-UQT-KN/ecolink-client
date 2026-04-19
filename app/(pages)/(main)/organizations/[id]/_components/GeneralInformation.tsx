"use client";

import React, { memo, useMemo } from "react";
import { HiMail } from "react-icons/hi";
import { AlignLeft, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

function formatCreatedAt(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    return format(parseISO(iso), "PPP");
  } catch {
    return iso;
  }
}

export const GeneralInformation = memo(function GeneralInformation() {
  const { t } = useTranslation();
  const { organization } = useOrganizationDetail();

  const contactEmail = organization?.contact_email?.trim() ?? "";
  const description = organization?.description?.trim() ?? "";
  const createdLabel = useMemo(
    () => formatCreatedAt(organization?.created_at),
    [organization?.created_at],
  );

  if (!organization) {
    return null;
  }

  return (
    <aside className="w-full rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/70 p-4 sm:p-5 space-y-5 shadow-sm">
      <div>
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t("Contact")}
        </p>
        <div className="mt-2 flex items-start gap-2 text-sm text-foreground min-w-0">
          <HiMail
            className="size-4 shrink-0 text-button-accent mt-0.5"
            aria-hidden
          />
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="break-all text-foreground-secondary hover:underline"
            >
              {contactEmail}
            </a>
          ) : (
            <span className="text-foreground-secondary">—</span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-[rgba(136,122,71,0.25)] bg-white/50 px-3 py-2.5">
        <AlignLeft className="size-4 shrink-0 text-button-accent mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground-tertiary">
            {t("Description")}
          </p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
            {description ? description : "—"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t("Created at")}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
          <Calendar className="size-4 shrink-0 text-button-accent" aria-hidden />
          <span>{createdLabel}</span>
        </div>
      </div>
    </aside>
  );
});
