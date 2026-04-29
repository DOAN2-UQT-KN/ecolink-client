"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { getCampaigns } from "@/apis/campaign/getCampaigns";
import { getReports } from "@/apis/incident/getReport";
import { STATUS } from "@/constants/status";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400 text-sm">Initialising map…</span>
    </div>
  ),
});
const FilterPanel = dynamic(() => import("./FilterPanel"), { ssr: false });

// ─── shared types ──────────────────────────────────────────────────────────────
export type MarkerType = "CAMPAIGN" | "INCIDENT";

export interface MapMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  type: MarkerType;
  status?: number | null;
  address?: string | null;
  wasteType?: string | null;
}

export interface FilterState {
  status: "all" | "pending" | "resolved";
  wasteType: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<FilterState["status"], number | undefined> = {
  all: undefined,
  pending: STATUS.PENDING,
  resolved: STATUS.COMPLETED,
};

function toCampaignMarkers(raw: any[]): MapMarker[] {
  return raw
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: String(c.id),
      title: c.title || "Untitled Campaign",
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      type: "CAMPAIGN" as const,
      status: c.status ?? null,
      address: c.detail_address ?? null,
      wasteType: null,
    }));
}

function toIncidentMarkers(raw: any[]): MapMarker[] {
  return raw
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({
      id: String(i.id),
      title: i.title || "Untitled Incident",
      lat: Number(i.latitude),
      lng: Number(i.longitude),
      type: "INCIDENT" as const,
      status: i.status ?? null,
      address: i.detail_address ?? null,
      wasteType: i.waste_type ?? null,
    }));
}

// ─── component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    wasteType: "all",
  });
  const [campaigns, setCampaigns] = useState<MapMarker[]>([]);
  const [incidents, setIncidents] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const statusNum = STATUS_MAP[filters.status];
    const wasteType =
      filters.wasteType !== "all" ? filters.wasteType : undefined;

    const [campaignRes, incidentRes] = await Promise.allSettled([
      getCampaigns({ status: statusNum, limit: 200 }),
      getReports({ status: statusNum, waste_type: wasteType, limit: 200 }),
    ]);

    if (campaignRes.status === "fulfilled") {
      const data = (campaignRes.value as any)?.campaigns ?? [];
      setCampaigns(toCampaignMarkers(data));
    }

    if (incidentRes.status === "fulfilled") {
      const data = (incidentRes.value as any)?.reports ?? [];
      setIncidents(toIncidentMarkers(data));
    }

    setLoading(false);
    setLastUpdated(new Date());
  }, [filters]);

  // Initial fetch + 10-second auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markers = useMemo(
    () => [...campaigns, ...incidents],
    [campaigns, incidents],
  );

  return (
    // Break out of the main layout's py-[92px] px-[20px] lg:px-[160px] padding
    <div className="-mt-[92px] -mb-[92px] -mx-[20px] lg:-mx-[160px] h-screen relative overflow-hidden">
      <MapView markers={markers} loading={loading} />
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
        lastUpdated={lastUpdated}
        counts={{ campaigns: campaigns.length, incidents: incidents.length }}
      />
    </div>
  );
}
