"use client";

import React, { memo, useMemo } from "react";
import { X } from "lucide-react";
import { BiGroup } from "react-icons/bi";
import { HiOutlineUserRemove } from "react-icons/hi";
import { useTranslation } from "react-i18next";

import { Button as SharedButton } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

export const HeroSection = memo(function HeroSection() {
  const { t } = useTranslation();
  const {
    organization,
    organizationId,
    showYourGroupTag,
    showJoinButton,
    showCancelButton,
    showLeaveButton,
    isLeaveConfirmOpen,
    setIsLeaveConfirmOpen,
    isJoinPending,
    isCancelPending,
    isLeavePending,
    handleJoinClick,
    handleCancelJoinClick,
    handleLeaveClick,
    handleConfirmLeave,
  } = useOrganizationDetail();

  const backgroundUrl = organization?.background_url?.trim() ?? "";
  const logoUrl = organization?.logo_url?.trim() ?? "";
  const name = organization?.name?.trim() ? organization.name : "—";

  const headerClassName = useMemo(
    () =>
      cn(
        "relative h-40 sm:h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-button-accent/30 via-white/10 to-white/5",
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

  if (!organization) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden rounded-xl border border-[rgba(136,122,71,0.5)] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className={headerClassName} style={headerStyle}>
        {backgroundUrl ? (
          <div className="absolute inset-0 bg-black/25" aria-hidden />
        ) : null}
      </div>

      <div className="relative px-4 pb-5 pt-0 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center -mt-12 sm:-mt-14">
          <div
            className={cn(
              "relative z-10 size-24 sm:size-28 rounded-full border-2 border-white/90 bg-white shadow-md overflow-hidden flex items-center justify-center",
              !logoUrl && "bg-muted",
            )}
          >
            {logoUrl ? (
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

        <div className="text-center space-y-1 pt-1 w-full max-w-2xl">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <h1 className="font-display-5 font-semibold text-foreground break-words text-center max-w-full">
              {name}
            </h1>
            {showYourGroupTag ? (
              <span
                className="shrink-0 inline-flex items-center rounded-sm border border-[rgba(136,122,71,0.45)] bg-button-accent/10 px-2.5 py-0.5 text-xs font-semibold text-button-accent"
                aria-label={t("Your group")}
              >
                {t("Your group")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="pt-1 flex items-center justify-center gap-2 w-full max-w-md">
          {showCancelButton ? (
            <SharedButton
              variant="brown"
              size="medium"
              className="flex-1 min-w-0"
              iconLeft={<X className="size-4" aria-hidden />}
              isLoading={isCancelPending}
              onClick={handleCancelJoinClick}
            >
              {t("Cancel")}
            </SharedButton>
          ) : showLeaveButton ? (
            <div className="relative flex-1 min-w-0">
              <SharedButton
                variant="brown"
                size="medium"
                className="w-full"
                iconLeft={
                  <HiOutlineUserRemove className="size-4" aria-hidden />
                }
                isLoading={isLeavePending}
                isDisabled={!organizationId}
                onClick={handleLeaveClick}
              >
                {t("Leave")}
              </SharedButton>
              {isLeaveConfirmOpen ? (
                <div className="absolute top-[calc(100%+8px)] left-0 z-10 w-full rounded-md border border-[rgba(136,122,71,0.45)] bg-white p-3 shadow-md">
                  <p className="text-sm text-foreground text-center">
                    {t("Are you sure?")}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <SharedButton
                      variant="outlined-brown"
                      size="small"
                      className="flex-1"
                      onClick={() => setIsLeaveConfirmOpen(false)}
                    >
                      {t("Cancel")}
                    </SharedButton>
                    <SharedButton
                      variant="brown"
                      size="small"
                      className="flex-1"
                      isLoading={isLeavePending}
                      isDisabled={!organizationId}
                      onClick={handleConfirmLeave}
                    >
                      {t("Confirm")}
                    </SharedButton>
                  </div>
                </div>
              ) : null}
            </div>
          ) : showJoinButton ? (
            <SharedButton
              variant="brown"
              size="medium"
              className="flex-1 min-w-0"
              iconLeft={<BiGroup className="size-4" aria-hidden />}
              isLoading={isJoinPending}
              isDisabled={!organizationId}
              onClick={handleJoinClick}
            >
              {t("Join")}
            </SharedButton>
          ) : null}
        </div>
      </div>
    </section>
  );
});
