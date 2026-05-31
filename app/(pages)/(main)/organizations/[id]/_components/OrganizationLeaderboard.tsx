"use client";

import { memo } from "react";

import LeaderboardPanel from "../../../leaderboard/_components/LeaderboardPanel";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

type OrganizationLeaderboardProps = {
  enabled: boolean;
};

export const OrganizationLeaderboard = memo(function OrganizationLeaderboard({
  enabled,
}: OrganizationLeaderboardProps) {
  const { organizationId } = useOrganizationDetail();

  if (!enabled || !organizationId) {
    return null;
  }

  return <LeaderboardPanel variant="organization" organizationId={organizationId} />;
});
