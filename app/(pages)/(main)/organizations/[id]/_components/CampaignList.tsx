"use client";

import React, { memo } from "react";

export const CampaignList = memo(function CampaignList() {
  return (
    <div className="w-full min-h-[220px] rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm">
      <div className="text-sm font-medium text-foreground">Campaign</div>
      <p className="mt-2 text-sm text-muted-foreground">Placeholder</p>
    </div>
  );
});
