"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import LeaderboardTop3 from "./LeaderboardTop3";
import LeaderboardList from "./LeaderboardList";
import MetricTabs from "./MetricTabs";
import SeasonList from "./SeasonList";
import type { LeaderboardPanelVariant } from "./useLeaderboardPanel";
import { useLeaderboardPanel } from "./useLeaderboardPanel";
import type { MetricValue } from "./types";

type LeaderboardPanelProps = {
  variant: LeaderboardPanelVariant;
  organizationId?: string;
};

export default function LeaderboardPanel({
  variant,
  organizationId,
}: LeaderboardPanelProps) {
  const { t } = useTranslation("common");
  const {
    metric,
    setMetric,
    scope,
    setScope,
    seasonPage,
    setSeasonPage,
    selectedSeasonId,
    setSelectedSeasonId,
    seasons,
    seasonsTotalPages,
    top3,
    listRows,
    loading,
    metricOptions,
    showMyRank,
    displayRows,
  } = useLeaderboardPanel({ variant, organizationId });

  const metricLabelMap: Record<MetricValue, string> = {
    crp: t("GamificationCitizen"),
    vrp: t("GamificationVolunteer"),
    org_aggregate: t("Organizations"),
  };

  return (
    <div className="space-y-6">
      <MetricTabs
        metric={metric}
        scope={scope}
        metricOptions={metricOptions}
        showMyRank={showMyRank}
        onMetricChange={setMetric}
        onScopeChange={setScope}
        metricLabels={metricLabelMap}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="space-y-4">
          {loading ? (
            <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background shadow-primary-100">
              <Loader2 className="h-6 w-6 animate-spin text-button-accent-hover" />
            </div>
          ) : displayRows.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background p-6 text-center text-sm text-foreground-tertiary shadow-primary-100">
              {t("No leaderboard entries yet")}
            </div>
          ) : (
            <>
              {scope === "global" ? <LeaderboardTop3 top3={top3} /> : null}
              <LeaderboardList
                items={listRows}
                metricLabel={metricLabelMap[metric]}
              />
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
  );
}
