"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useGetGamificationLeaderboard,
  useGetGamificationLeaderboardMe,
  useGetGamificationPointsBySeason,
} from "@/apis/gamification";
import type { IGetGamificationLeaderboardRequest } from "@/apis/gamification";
import { useGetSeasonCurrent } from "@/apis/gamification/season/list";
import useAuthStore from "@/stores/useAuthStore";

import { normalizeLeaderboardRows } from "./normalizeLeaderboardRows";
import type { LeaderboardItem, MetricValue, ScopeValue, Season } from "./types";

const SEASONS_PER_PAGE = 5;
const LEADERBOARD_LIMIT = 20;

export type LeaderboardPanelVariant = "global" | "organization";

type UseLeaderboardPanelOptions = {
  variant: LeaderboardPanelVariant;
  organizationId?: string;
};

function statusToSeasonStatus(status: string): Season["status"] {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "FROZEN") return "FROZEN";
  return "CLOSED";
}

function seasonProgressText(crp: number, vrp: number, sp: number): string {
  const filled = (crp > 0 ? 1 : 0) + (vrp > 0 ? 1 : 0) + (sp > 0 ? 1 : 0);
  return `${Math.min(filled, 3)}/3`;
}

export function useLeaderboardPanel({
  variant,
  organizationId,
}: UseLeaderboardPanelOptions) {
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const [metric, setMetric] = useState<MetricValue>("crp");
  const [scope, setScope] = useState<ScopeValue>("global");
  const [seasonPage, setSeasonPage] = useState(1);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(
    undefined,
  );

  const seasonsQuery = useGetGamificationPointsBySeason(
    { page: seasonPage, limit: SEASONS_PER_PAGE },
    { enabled: isAuthenticated },
  );

  const seasonCurrentQuery = useGetSeasonCurrent({
    enabled: !isAuthenticated || (seasonsQuery.data?.data?.seasons?.length ?? 0) === 0,
  });

  const seasons = useMemo<Season[]>(() => {
    const seasonsData = seasonsQuery.data?.data?.seasons ?? [];
    if (seasonsData.length) {
      return seasonsData.map((season) => ({
        id: season.seasonId,
        label: season.label ?? "Untitled season",
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        status: statusToSeasonStatus(season.status),
        progressText: seasonProgressText(season.crp, season.vrp, season.sp),
      }));
    }

    const current = seasonCurrentQuery.data?.data?.season;
    if (!current) return [];

    return [
      {
        id: current.id,
        label: current.label ?? "Current season",
        startsAt: current.startsAt,
        endsAt: current.endsAt,
        status: statusToSeasonStatus(current.status),
        progressText: "—",
      },
    ];
  }, [seasonsQuery.data?.data?.seasons, seasonCurrentQuery.data?.data?.season]);

  useEffect(() => {
    if (!selectedSeasonId && seasons.length) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [selectedSeasonId, seasons]);

  const leaderboardRequest = useMemo((): IGetGamificationLeaderboardRequest => {
    const base: IGetGamificationLeaderboardRequest = {
      metric,
      seasonId: selectedSeasonId,
      page: 1,
      limit: LEADERBOARD_LIMIT,
    };
    if (variant === "organization" && organizationId && metric !== "org_aggregate") {
      base.organizationId = organizationId;
    }
    return base;
  }, [metric, selectedSeasonId, variant, organizationId]);

  const leaderboardQuery = useGetGamificationLeaderboard(leaderboardRequest, {
    enabled:
      Boolean(selectedSeasonId) &&
      (variant !== "organization" || Boolean(organizationId)) &&
      (variant === "global" || metric !== "org_aggregate"),
  });

  const meMetric = metric === "org_aggregate" ? "crp" : metric;
  const leaderboardMeQuery = useGetGamificationLeaderboardMe(
    {
      metric: meMetric,
      seasonId: selectedSeasonId,
      ...(variant === "organization" && organizationId
        ? { organizationId }
        : {}),
    },
    {
      enabled:
        Boolean(selectedSeasonId) &&
        scope === "my_rank" &&
        metric !== "org_aggregate" &&
        isAuthenticated &&
        (variant !== "organization" || Boolean(organizationId)),
    },
  );

  const normalizedLeaderboard = useMemo<LeaderboardItem[]>(() => {
    const rows = leaderboardQuery.data?.data?.leaderboard ?? [];
    return normalizeLeaderboardRows(rows);
  }, [leaderboardQuery.data?.data?.leaderboard]);

  const myRankRow = useMemo(() => {
    if (scope !== "my_rank") return null;
    const me = leaderboardMeQuery.data?.data?.leaderboardMe;
    if (!me) return null;

    const fromList = normalizedLeaderboard.find((item) => item.rank === me.rank);
    if (fromList) return fromList;

    return {
      userId: "me",
      rank: me.rank,
      score: me.score,
      name: "You",
      avatar: "",
      participatedCount: 0,
    };
  }, [scope, leaderboardMeQuery.data?.data?.leaderboardMe, normalizedLeaderboard]);

  const displayRows =
    scope === "my_rank" ? (myRankRow ? [myRankRow] : []) : normalizedLeaderboard;
  const top3 =
    scope === "global" ? displayRows.filter((item) => item.rank <= 3).slice(0, 3) : [];
  const listRows =
    scope === "global" ? displayRows.filter((item) => item.rank > 3) : displayRows;

  const loading =
    seasonsQuery.isLoading ||
    seasonCurrentQuery.isLoading ||
    leaderboardQuery.isLoading;

  const metricOptions: MetricValue[] =
    variant === "global" ? ["crp", "vrp", "org_aggregate"] : ["crp", "vrp"];

  useEffect(() => {
    if (variant === "organization" && metric === "org_aggregate") {
      setMetric("crp");
    }
  }, [variant, metric]);

  return {
    metric,
    setMetric,
    scope,
    setScope,
    seasonPage,
    setSeasonPage,
    selectedSeasonId,
    setSelectedSeasonId,
    seasons,
    seasonsTotalPages: seasonsQuery.data?.data?.totalPages ?? 1,
    normalizedLeaderboard,
    displayRows,
    top3,
    listRows,
    loading,
    metricOptions,
    showMyRank: isAuthenticated,
  };
}
