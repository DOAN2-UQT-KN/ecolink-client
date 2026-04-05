"use client";

import React from "react";
import Image from "next/image";
import { HiOutlineBookmark } from "react-icons/hi";
import { getRelativeTime } from "../utils/time";
import { IUser } from "@/apis/auth/models/user";
import { useTranslation } from "react-i18next";

interface ReportHeaderProps {
  user?: IUser;
  createdAt: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  user,
  createdAt,
}) => {
  const { t, i18n } = useTranslation();
  const userName = user?.name || t("Anonymous");
  const userAvatar = user?.avatar || "/default-avatar.png"; // Fallback path

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="relative w-[56px] h-[56px] overflow-hidden rounded-full border border-border">
          <Image
            src={userAvatar}
            alt={userName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h4 className="font-semibold font-display-2 leading-tight text-black">
            {userName}
          </h4>
          <span className="font-display-1 text-foreground-secondary">
            {getRelativeTime(createdAt, i18n.language)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="p-2.5 hover:bg-accent rounded-full transition-all duration-200 text-foreground-secondary hover:text-primary active:scale-90"
        onClick={() => {
          // Mock save logic
          console.log("Saving report...");
        }}
        title={t("Save report")}
      >
        <HiOutlineBookmark size={24} />
      </button>
    </div>
  );
};
