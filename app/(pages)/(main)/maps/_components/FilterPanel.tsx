"use client";

import { memo, useCallback } from "react";
import { Map, RefreshCw, Activity } from "lucide-react";
import type { FilterState } from "./MapPage";

// ─── option lists ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: FilterState["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
];

const TYPE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "all", label: "All Types", emoji: "🌐" },
  { value: "medical", label: "Medical", emoji: "🏥" },
  { value: "food", label: "Food", emoji: "🍲" },
  { value: "shelter", label: "Shelter", emoji: "🏠" },
  { value: "clothes", label: "Clothes", emoji: "👕" },
  { value: "emergency", label: "Emergency", emoji: "🚨" },
];

// ─── sub-components ────────────────────────────────────────────────────────────
const SectionLabel = memo(function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
      {children}
    </p>
  );
});

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: "emerald" | "blue";
  children: React.ReactNode;
}) {
  const activeClass =
    color === "emerald"
      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
      : "bg-blue-600 text-white shadow-sm shadow-blue-200";
  const idleClass = "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${active ? activeClass : idleClass}`}
    >
      {children}
    </button>
  );
}

// ─── filter panel ──────────────────────────────────────────────────────────────
interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  loading: boolean;
  lastUpdated: Date | null;
  counts: { campaigns: number; incidents: number };
}

const FilterPanel = memo(function FilterPanel({
  filters,
  onFiltersChange,
  loading,
  lastUpdated,
  counts,
}: FilterPanelProps) {
  const setStatus = useCallback(
    (status: FilterState["status"]) => onFiltersChange({ ...filters, status }),
    [filters, onFiltersChange],
  );

  const setWasteType = useCallback(
    (wasteType: string) => onFiltersChange({ ...filters, wasteType }),
    [filters, onFiltersChange],
  );

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white/95 backdrop-blur-md">
      {/* ── header ── */}
      <div className="px-5 py-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Map className="h-4 w-4 flex-shrink-0" />
          <span className="font-bold text-base tracking-tight">
            Disaster Relief Map
          </span>
          {loading && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin ml-auto opacity-80" />
          )}
        </div>

        {/* live stats */}
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-300 inline-block" />
            {counts.campaigns} campaigns
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-300 inline-block" />
            {counts.incidents} incidents
          </span>
        </div>

        {formattedTime && (
          <p className="text-[10px] text-white/50 mt-1.5 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Updated {formattedTime} · auto-refresh 10 s
          </p>
        )}
      </div>

      {/* ── body ── */}
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)]">
        {/* Status */}
        <div>
          <SectionLabel>Status</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={filters.status === opt.value}
                onClick={() => setStatus(opt.value)}
                color="emerald"
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Type (incident waste_type) */}
        <div>
          <SectionLabel>Type</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={filters.wasteType === opt.value}
                onClick={() => setWasteType(opt.value)}
                color="blue"
              >
                {opt.emoji} {opt.label}
              </Chip>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Type filter applies to incidents only.
          </p>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-100 pt-4">
          <SectionLabel>Legend</SectionLabel>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
              <span className="text-xs text-gray-600 font-medium">
                Campaign
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
              <span className="text-xs text-gray-600 font-medium">
                Incident
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterPanel;
