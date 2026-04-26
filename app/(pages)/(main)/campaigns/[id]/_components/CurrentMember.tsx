"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";

import { useCampaignDetail } from "../_hooks/useCampaignDetail";

const MOCK_MEMBERS = [
  { name: "Alex River", role: "Volunteer" },
  { name: "Sam Lee", role: "Volunteer" },
  { name: "Jordan Kim", role: "Coordinator" },
] as const;

export const CurrentMember = memo(function CurrentMember() {
  const { t } = useTranslation();
  const { currentMembers } = useCampaignDetail();

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
      <p className="font-display-1 text-muted-foreground mb-4">
        {t("Sample member list. Reported count:")}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {currentMembers}
        </span>
      </p>
      <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
        {MOCK_MEMBERS.map((m) => (
          <li
            key={m.name}
            className="flex items-center justify-between py-3 font-display-1"
          >
            <span className="font-medium text-foreground">{m.name}</span>
            <span className="text-muted-foreground">{m.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
