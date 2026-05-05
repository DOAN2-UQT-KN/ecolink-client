"use client";

import type { MetricValue, ScopeValue } from "./types";

type MetricTabsProps = {
  metric: MetricValue;
  scope: ScopeValue;
  onMetricChange: (metric: MetricValue) => void;
  onScopeChange: (scope: ScopeValue) => void;
};

const metricOptions: { label: string; value: MetricValue }[] = [
  { label: "CRP", value: "crp" },
  { label: "VRP", value: "vrp" },
  { label: "ORG", value: "org_aggregate" },
];

const scopeOptions: { label: string; value: ScopeValue }[] = [
  { label: "Global", value: "global" },
  { label: "My Rank", value: "my_rank" },
];

export default function MetricTabs({ metric, scope, onMetricChange, onScopeChange }: MetricTabsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {metricOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onMetricChange(option.value)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              option.value === metric
                ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : "bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {scopeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onScopeChange(option.value)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              option.value === scope ? "bg-white text-zinc-900" : "bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
