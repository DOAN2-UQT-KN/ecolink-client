"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineCheckCircle } from "react-icons/hi";

const MOCK_TASKS = [
  { id: "1", title: "Shoreline cleanup — Zone A" },
  { id: "2", title: "Waste sorting orientation" },
  { id: "3", title: "Community briefing session" },
] as const;

export const CampaignTask = memo(function CampaignTask() {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
      <h3 className="font-display-6 font-semibold text-button-accent mb-4">
        {t("Tasks")}
      </h3>
      <ul className="space-y-3">
        {MOCK_TASKS.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-[rgba(136,122,71,0.25)] bg-white/80 px-4 py-3 font-display-1 text-foreground"
          >
            <HiOutlineCheckCircle
              className="size-5 shrink-0 text-button-accent/80"
              aria-hidden
            />
            {task.title}
          </li>
        ))}
      </ul>
    </div>
  );
});
