"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trophy } from "lucide-react";

import {
  useGetGamificationLeaderboard,
  useGetGamificationLeaderboardMe,
  useGetGamificationPointsBySeason,
} from "@/apis/gamification";
import type { IGetGamificationLeaderboardRequest } from "@/apis/gamification";
import LeaderboardTop3 from "./_components/LeaderboardTop3";
import LeaderboardList from "./_components/LeaderboardList";
import MetricTabs from "./_components/MetricTabs";
import SeasonList from "./_components/SeasonList";
import { mockLeaderboard, mockSeasons } from "./_components/mock-data";
import type { LeaderboardItem, MetricValue, ScopeValue, Season } from "./_components/types";

const SEASONS_PER_PAGE = 5;
const LEADERBOARD_LIMIT = 20;

const metricLabelMap: Record<MetricValue, string> = {
  crp: "CRP",
  vrp: "VRP",
  org_aggregate: "ORG",
};

function statusToSeasonStatus(status: string): Season["status"] {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "FROZEN") return "FROZEN";
  return "CLOSED";
}

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<MetricValue>("crp");
  const [scope, setScope] = useState<ScopeValue>("global");
  const [seasonPage, setSeasonPage] = useState(1);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);

  const seasonsQuery = useGetGamificationPointsBySeason({
    page: seasonPage,
    limit: SEASONS_PER_PAGE,
  });

  const seasonsData = seasonsQuery.data?.data?.seasons ?? [];
  const seasonsTotalPages = seasonsQuery.data?.data?.totalPages ?? 1;

  const seasons = useMemo<Season[]>(() => {
    if (!seasonsData.length) return mockSeasons;
    return seasonsData.map((season) => ({
      id: season.seasonId,
      label: season.label ?? "Untitled season",
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      status: statusToSeasonStatus(season.status),
      progressText: `${Math.min((season.crp > 0 ? 1 : 0) + (season.vrp > 0 ? 1 : 0) + (season.sp > 0 ? 1 : 0), 3)}/4`,
    }));
  }, [seasonsData]);

  useEffect(() => {
    if (!selectedSeasonId && seasons.length) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [selectedSeasonId, seasons]);

  const leaderboardRequest: IGetGamificationLeaderboardRequest = useMemo(
    () => ({
      metric,
      seasonId: selectedSeasonId,
      page: 1,
      limit: LEADERBOARD_LIMIT,
    }),
    [metric, selectedSeasonId],
  );

  const leaderboardQuery = useGetGamificationLeaderboard(leaderboardRequest, {
    enabled: Boolean(selectedSeasonId),
  });

  const leaderboardMeQuery = useGetGamificationLeaderboardMe(
    {
      metric: metric === "org_aggregate" ? "crp" : metric,
      seasonId: selectedSeasonId,
    },
    {
      enabled: Boolean(selectedSeasonId) && scope === "my_rank" && metric !== "org_aggregate",
    },
  );

  const normalizedLeaderboard = useMemo<LeaderboardItem[]>(() => {
    const rows = leaderboardQuery.data?.data?.leaderboard ?? [];
    if (!rows.length) return mockLeaderboard;

    return rows.map((row) => {
      if ("userId" in row) {
        return {
          userId: row.userId,
          rank: row.rank,
          score: row.score,
          name: row.user?.name ?? "Unknown User",
          avatar: row.user?.avatar ?? "",
          participatedCount: 0,
        };
      }

      const orgShortId = row.organizationId.slice(0, 6);
      return {
        userId: row.organizationId,
        rank: row.rank,
        score: row.score,
        name: `Organization ${orgShortId}`,
        avatar: "",
        participatedCount: 0,
      };
    });
  }, [leaderboardQuery.data?.data?.leaderboard]);

  const myRankRow = useMemo(() => {
    if (scope !== "my_rank") return null;
    const me = leaderboardMeQuery.data?.data?.leaderboardMe;
    if (!me) return null;
    return normalizedLeaderboard.find((item) => item.rank === me.rank) ?? null;
  }, [leaderboardMeQuery.data?.data?.leaderboardMe, normalizedLeaderboard, scope]);

  const displayRows = scope === "my_rank" ? (myRankRow ? [myRankRow] : []) : normalizedLeaderboard;
  const top3 = scope === "global" ? displayRows.filter((item) => item.rank <= 3).slice(0, 3) : [];
  const listRows = scope === "global" ? displayRows.filter((item) => item.rank > 3) : displayRows;

  const loading = seasonsQuery.isLoading || leaderboardQuery.isLoading;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#1f2937_0%,_#09090b_55%)] px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-2">
            <Trophy className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-zinc-400">Compete and climb your rank every season.</p>
          </div>
        </div>

        <MetricTabs metric={metric} scope={scope} onMetricChange={setMetric} onScopeChange={setScope} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          <section className="space-y-4">
            {loading ? (
              <div className="flex h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
              </div>
            ) : (
              <>
                {scope === "global" ? <LeaderboardTop3 top3={top3} /> : null}
                <LeaderboardList items={listRows} metricLabel={metricLabelMap[metric]} />
              </>
            )}
          </section>

          <section>
            <SeasonList
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              onSelectSeason={setSelectedSeasonId}
              page={seasonPage}
              totalPages={seasonsTotalPages}
              onPageChange={setSeasonPage}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
