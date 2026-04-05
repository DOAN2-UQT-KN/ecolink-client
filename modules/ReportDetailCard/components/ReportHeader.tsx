"use client";

import React from "react";
import Image from "next/image";
import { HiOutlineBookmark, HiBookmark } from "react-icons/hi"; // Added HiBookmark for active state
import { getRelativeTime } from "../utils/time";
import { IUser } from "@/apis/auth/models/user";
import { useTranslation } from "react-i18next";
import { useSaveResource } from "@/apis/saved-resource";
import { useState } from "react";

interface ReportHeaderProps {
  reportId: string;
  user?: IUser;
  createdAt: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reportId,
  user,
  createdAt,
}) => {
  const { t, i18n } = useTranslation();
  const [isSaved, setIsSaved] = useState(false);
  const userName = user?.name || t("Anonymous");
  const userAvatar = user?.avatar || "/default-avatar.png"; // Fallback path

  const { mutate: saveResource, isPending } = useSaveResource({
    onSuccess: () => {
      setIsSaved(!isSaved);
    },
  });

  const handleSave = () => {
    saveResource({
      resource_id: reportId,
      resource_type: "report",
    });
  };

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
        className="p-2.5 hover:bg-accent rounded-full transition-all duration-200 text-foreground-secondary hover:text-primary active:scale-90 disabled:opacity-50"
        onClick={handleSave}
        disabled={isPending}
        title={t("Save report")}
      >
        {isSaved ? (
          <HiBookmark size={24} className="text-primary" />
        ) : (
          <HiOutlineBookmark size={24} />
        )}
      </button>
    </div>
  );
};
