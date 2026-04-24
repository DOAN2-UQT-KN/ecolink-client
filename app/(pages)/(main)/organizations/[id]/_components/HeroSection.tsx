"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Image as AntdImage } from "antd";
import { BiGroup } from "react-icons/bi";
import { HiOutlineUserRemove } from "react-icons/hi";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HiEye, HiPencilAlt } from "react-icons/hi";

import { Button as SharedButton } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";
import { UpdateOrganizationPopover } from "@/app/(pages)/(main)/organizations/me/_components/UpdateOrganizationPopover";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";
import { HiXMark } from "react-icons/hi2";

export const HeroSection = memo(function HeroSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
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

  const handleOrganizationUpdated = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["organization", organizationId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["organization-join-requests", organizationId],
    });
  }, [queryClient, organizationId]);

  const backgroundUrl = organization?.background_url?.trim() ?? "";
  const logoUrl = organization?.logo_url?.trim() ?? "";
  const name = organization?.name?.trim() ? organization.name : "—";

  const headerClassName = useMemo(
    () =>
      cn(
        "relative h-44 sm:h-52 w-full overflow-hidden rounded-t-xl rounded-b-none bg-gradient-to-br from-button-accent/30 via-white/10 to-white/5",
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

  const openImagePreview = useCallback((src: string) => {
    setPreviewImageSrc(src);
  }, []);

  if (!organization) {
    return null;
  }

  return (
    <>
    <section className="w-full overflow-hidden rounded-xl border border-[rgba(136,122,71,0.5)] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div
        className={cn(headerClassName, backgroundUrl && "group cursor-pointer")}
        style={headerStyle}
        onClick={backgroundUrl ? () => openImagePreview(backgroundUrl) : undefined}
        role={backgroundUrl ? "button" : undefined}
        tabIndex={backgroundUrl ? 0 : undefined}
        onKeyDown={
          backgroundUrl
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openImagePreview(backgroundUrl);
                }
              }
            : undefined
        }
      >
        {backgroundUrl ? (
          <>
            <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" aria-hidden />
            <div className="absolute inset-0 z-[1] flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
              {/* <span className="inline-flex items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-[1px]"> */}
                <HiEye className="size-10 text-white/80" />
              {/* </span> */}
            </div>
          </>
        ) : null}
      </div>

      <div className="relative rounded-b-xl px-4 pb-6 pt-2 sm:pt-6">
        <div className="flex min-h-[5.5rem] sm:min-h-[6.5rem] items-center gap-4 sm:gap-5">
          <div
            className={cn(
              "relative z-10 shrink-0 size-32 sm:size-40 -mt-[4.25rem] sm:-mt-[5.25rem] -translate-x-1 sm:-translate-x-1.5 rounded-full border-[3px] border-white/95 bg-white shadow-md overflow-hidden flex items-center justify-center",
              logoUrl && "group cursor-pointer",
              !logoUrl && "bg-muted",
            )}
            onClick={logoUrl ? () => openImagePreview(logoUrl) : undefined}
            role={logoUrl ? "button" : undefined}
            tabIndex={logoUrl ? 0 : undefined}
            onKeyDown={
              logoUrl
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openImagePreview(logoUrl);
                    }
                  }
                : undefined
            }
          >
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary logo URLs */}
                <img
                  src={logoUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                    <HiEye className="size-8 text-white/80" />
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground px-2 text-center">
                Logo
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-start gap-3 -translate-y-3 sm:-translate-y-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="font-display-8 font-title font-semibold text-foreground break-words text-left">
                {name}
              </div>
              {showYourGroupTag ? (
                <span
                  className="shrink-0 inline-flex items-center rounded-sm border border-[rgba(136,122,71,0.45)] bg-button-accent/10 px-2.5 py-0.5 text-xs font-semibold text-button-accent"
                  aria-label={t("Your group")}
                >
                  {t("Your group")}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-stretch gap-2 w-full max-w-md">
              {showCancelButton ? (
                <SharedButton
                  variant="brown"
                  size="medium"
                  className="min-w-0 flex-1 sm:flex-none sm:min-w-[140px]"
                  iconLeft={<HiXMark className="size-4" aria-hidden />}
                  isLoading={isCancelPending}
                  onClick={handleCancelJoinClick}
                >
                  {t("Cancel")}
                </SharedButton>
              ) : showLeaveButton ? (
                <div className="relative w-full max-w-xs min-w-0">
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
                    <div className="absolute top-[calc(100%+8px)] left-0 z-10 w-full min-w-[240px] max-w-sm rounded-md border border-[rgba(136,122,71,0.45)] bg-white p-3 shadow-md">
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
                  className="min-w-0 flex-1 sm:flex-none sm:min-w-[140px]"
                  iconLeft={<BiGroup className="size-4" aria-hidden />}
                  isLoading={isJoinPending}
                  isDisabled={!organizationId}
                  onClick={handleJoinClick}
                >
                  {t("Join")}
                </SharedButton>
              ) : showYourGroupTag ? (
                <SharedButton
                  variant="outlined-brown"
                  size="medium"
                  className="min-w-0 flex-1 sm:flex-none sm:min-w-[140px]"
                  iconLeft={<HiPencilAlt className="size-4" aria-hidden />}
                  onClick={() => setIsEditGroupOpen(true)}
                >
                  {t("Edit group")}
                </SharedButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
    <UpdateOrganizationPopover
      organization={organization}
      open={isEditGroupOpen}
      onOpenChange={setIsEditGroupOpen}
      onUpdated={handleOrganizationUpdated}
    />
    {previewImageSrc ? (
      <AntdImage
        src={previewImageSrc}
        alt={organization?.name ?? "preview"}
        className="hidden"
        preview={{
          visible: Boolean(previewImageSrc),
          onVisibleChange: (visible) => {
            if (!visible) {
              setPreviewImageSrc(null);
            }
          },
        }}
      />
    ) : null}
    </>
  );
});
