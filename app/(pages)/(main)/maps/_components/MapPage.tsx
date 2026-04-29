'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { getAllCampaigns } from '@/apis/campaign/getCampaigns';
import { getAllReports } from '@/apis/incident/getReport';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400 text-sm">Initialising map…</span>
    </div>
  ),
});
const FilterPanel = dynamic(() => import('./FilterPanel'), { ssr: false });

// ─── shared types ──────────────────────────────────────────────────────────────
export type MarkerType = 'CAMPAIGN' | 'INCIDENT';

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

// ─── helpers ───────────────────────────────────────────────────────────────────
function toCampaignMarkers(raw: any[], fallback: string): MapMarker[] {
  return raw
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: String(c.id),
      title: c.title || fallback,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      type: 'CAMPAIGN' as const,
      status: c.status ?? null,
      address: c.detail_address ?? null,
      wasteType: null,
    }));
}

function toIncidentMarkers(raw: any[], fallback: string): MapMarker[] {
  return raw
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({
      id: String(i.id),
      title: i.title || fallback,
      lat: Number(i.latitude),
      lng: Number(i.longitude),
      type: 'INCIDENT' as const,
      status: i.status ?? null,
      address: i.detail_address ?? null,
      wasteType: i.waste_type ?? null,
    }));
}

// ─── component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<MapMarker[]>([]);
  const [incidents, setIncidents] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [campaignRes, incidentRes] = await Promise.allSettled([
      getAllCampaigns({}),
      getAllReports({}),
    ]);

    if (campaignRes.status === 'fulfilled') {
      const data = (campaignRes.value as any)?.data?.campaigns ?? [];
      setCampaigns(toCampaignMarkers(data, t('Untitled Campaign')));
    }

    if (incidentRes.status === 'fulfilled') {
      const data = (incidentRes.value as any)?.data?.reports ?? [];
      setIncidents(toIncidentMarkers(data, t('Untitled Incident')));
    }

    setLoading(false);
    setLastUpdated(new Date());
  }, [t]);

  // Initial fetch + 10-second auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markers = useMemo(() => [...campaigns, ...incidents], [campaigns, incidents]);

  return (
    // Break out of the main layout's py-[92px] px-[20px] lg:px-[160px] padding
    <div className="-mt-[92px] -mb-[92px] -mx-[20px] lg:-mx-[160px] h-screen relative overflow-hidden">
      <MapView markers={markers} loading={loading} />
      <FilterPanel
        loading={loading}
        lastUpdated={lastUpdated}
        counts={{ campaigns: campaigns.length, incidents: incidents.length }}
      />
    </div>
  );
}
