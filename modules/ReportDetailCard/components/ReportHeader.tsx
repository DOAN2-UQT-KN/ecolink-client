"use client";

import React, { memo, useCallback, useMemo } from "react";
import Image from "next/image";
import { getRelativeTime } from "../utils/time";
import { IUser } from "@/apis/auth/models/user";
import { useTranslation } from "react-i18next";
import { useSaveResource } from "@/apis/saved-resource";
import { TbBookmark, TbBookmarkFilled } from "react-icons/tb";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/libs/utils";

interface ReportHeaderProps {
  reportId: string;
  user?: IUser;
  createdAt: string;
  isSaved?: boolean;
  /** When false, hides the save (bookmark) control — e.g. admin read-only preview. */
  showAction?: boolean;
}

export const ReportHeader = memo(function ReportHeader({
  reportId,
  user,
  createdAt,
  isSaved = false,
  showAction = true,
}: ReportHeaderProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const userName = useMemo(() => user?.name || t("Anonymous"), [user, t]);
  const userAvatar = useMemo(() => user?.avatar || "/default-avatar.png", [
    user,
  ]);

  const { mutate: saveResource, isPending } = useSaveResource({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    },
  });

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      saveResource({
        resource_id: reportId,
        resource_type: "report",
      });
    },
    [reportId, saveResource],
  );

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3",
        showAction ? "justify-between" : "",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[56px] w-[56px] overflow-hidden rounded-full border border-border">
          <Image
            src={userAvatar}
            alt={userName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h4 className="font-display-2 font-semibold leading-tight text-black">
            {userName}
          </h4>
          <span className="font-display-1 text-foreground-secondary">
            {getRelativeTime(createdAt, i18n.language)}
          </span>
        </div>
      </div>

      {showAction ? (
        <button
          type="button"
          className="cursor-pointer rounded-full p-2.5 text-foreground-secondary transition-all duration-200 hover:bg-accent hover:text-primary active:scale-90 disabled:opacity-50"
          onClick={handleSave}
          disabled={isPending}
          title={t("Save report")}
        >
          {isSaved ? (
            <TbBookmarkFilled size={24} className="text-yellow-500" />
          ) : (
            <TbBookmark size={24} />
          )}
        </button>
      ) : null}
    </div>
  );
});
