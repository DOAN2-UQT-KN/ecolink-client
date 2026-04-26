"use client";

import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/libs/utils";

import { useCampaignDetail } from "../_hooks/useCampaignDetail";

const DEFAULT_BANNER = "/banner-default.jpg";

export const HeroSection = memo(function HeroSection() {
  const { t } = useTranslation();
  const { campaign } = useCampaignDetail();

  const backgroundUrl = useMemo(
    () => (campaign?.banner?.trim() ? campaign.banner : DEFAULT_BANNER),
    [campaign?.banner],
  );

  const title = useMemo(
    () =>
      campaign?.title?.trim()
        ? campaign.title
        : t("Campaign"),
    [campaign?.title, t],
  );

  if (!campaign) {
    return null;
  }

  return (
    <section className="w-full -mx-4 sm:mx-0 min-w-0">
      <div className="relative w-full min-h-[200px] sm:min-h-[280px] lg:min-h-[320px] overflow-hidden rounded-none sm:rounded-xl border-x-0 sm:border border-[rgba(136,122,71,0.5)] bg-white/80 shadow-sm ring-1 ring-white/5">
        <div
          className="absolute inset-0 bg-center bg-cover scale-[1.02]"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
          role="img"
          aria-label=""
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-amber-900/10 to-slate-900/15"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.12)]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/85 via-white/50 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/90 to-transparent sm:h-32" />
        <div className="relative z-10 flex min-h-[200px] sm:min-h-[280px] lg:min-h-[320px] w-full items-end px-4 pb-8 pt-10 sm:px-8 sm:pb-10">
          <div className="w-full max-w-4xl">
            <h1
              className={cn(
                "font-display-8 sm:font-display-10 font-title font-semibold",
                "text-button-accent break-words drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]",
              )}
            >
              {title}
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
});
