"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { TbCircleCheck, TbCircleX } from "react-icons/tb";

import { Button } from "@/components/client/shared/Button";
import { useSubmitCompletionVerification } from "@/apis/campaign/submitCompletionVerification";
import { cn } from "@/libs/utils";

interface CampaignCompletionVerifyButtonProps {
  campaignId: string;
  cleanCount: number;
  notCleanCount: number;
  myVerification: number | null;
}

export const CampaignCompletionVerifyButton = memo(
  function CampaignCompletionVerifyButton({
    campaignId,
    cleanCount: initialClean,
    notCleanCount: initialNotClean,
    myVerification: initialMyVerification,
  }: CampaignCompletionVerifyButtonProps) {
    const { t } = useTranslation("common");
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [cleanCount, setCleanCount] = useState(initialClean);
    const [notCleanCount, setNotCleanCount] = useState(initialNotClean);
    const [myVerification, setMyVerification] = useState(initialMyVerification);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setCleanCount(initialClean);
      setNotCleanCount(initialNotClean);
      setMyVerification(initialMyVerification);
    }, [initialClean, initialNotClean, initialMyVerification]);

    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    const { mutateAsync: submit, isPending } = useSubmitCompletionVerification();

    const refreshCampaign = useCallback(async () => {
      await queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      const refreshed = queryClient.getQueryData<{
        data?: {
          campaign?: {
            completion_verification?: {
              clean_count?: number;
              not_clean_count?: number;
              my_verification?: number | null;
            };
          };
        };
      }>(["campaign", campaignId]);
      const v = refreshed?.data?.campaign?.completion_verification;
      if (v) {
        setCleanCount(v.clean_count ?? 0);
        setNotCleanCount(v.not_clean_count ?? 0);
        setMyVerification(v.my_verification ?? null);
      }
    }, [campaignId, queryClient]);

    const handleSelect = useCallback(
      async (value: 1 | -1) => {
        try {
          await submit({ campaignId, value });
          await refreshCampaign();
          setOpen(false);
        } catch (error) {
          console.error("Failed to submit completion verification:", error);
        }
      },
      [campaignId, refreshCampaign, submit],
    );

    return (
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="outlined-brown"
          size="medium"
          onClick={() => setOpen((v) => !v)}
          isLoading={isPending}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {t("Verify")}
          <span className="ml-1.5 tabular-nums text-xs opacity-80">
            ({cleanCount} {t("Clean")} · {notCleanCount} {t("Not clean")})
          </span>
        </Button>

        {open ? (
          <div
            role="menu"
            className={cn(
              "absolute right-0 z-50 mt-2 min-w-[200px] rounded-lg border border-[rgba(136,122,71,0.5)]",
              "bg-white p-1.5 shadow-lg",
            )}
          >
            <button
              type="button"
              role="menuitem"
              disabled={isPending}
              onClick={() => void handleSelect(1)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-[rgba(136,122,71,0.12)] disabled:opacity-50",
                myVerification === 1 && "bg-emerald-50 text-emerald-800",
              )}
            >
              <TbCircleCheck size={18} aria-hidden />
              {t("Clean")}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={isPending}
              onClick={() => void handleSelect(-1)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-[rgba(136,122,71,0.12)] disabled:opacity-50",
                myVerification === -1 && "bg-rose-50 text-rose-800",
              )}
            >
              <TbCircleX size={18} aria-hidden />
              {t("Not clean")}
            </button>
          </div>
        ) : null}
      </div>
    );
  },
);
