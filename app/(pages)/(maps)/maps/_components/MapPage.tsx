'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { cn } from '@/libs/utils';
import { getAllCampaigns } from '@/apis/campaign/getCampaigns';
import { getAllReports } from '@/apis/incident/getReport';
import { getAllSOS } from '@/apis/sos/getSos';
import type { ISOS } from '@/apis/sos/models/sos';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400 text-sm">Initialising map…</span>
    </div>
  ),
});
const FilterPanel = dynamic(() => import('./FilterPanel'), { ssr: false });
const SOSForm = dynamic(() => import('./SOSForm'), { ssr: false });

// ─── shared types ──────────────────────────────────────────────────────────────
export type MarkerType = 'CAMPAIGN' | 'INCIDENT' | 'SOS';

export interface MapMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  type: MarkerType;
  status?: number | null;
  address?: string | null;
  wasteType?: string | null;
  // SOS-specific
  phone?: string | null;
  content?: string | null;
}

interface CampaignLike {
  id: string | number;
  title?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: number | null;
  detail_address?: string | null;
}

interface IncidentLike {
  id: string | number;
  title?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: number | null;
  detail_address?: string | null;
  waste_type?: string | null;
}

interface CampaignListResponse {
  data?: {
    campaigns?: CampaignLike[];
  };
}

interface IncidentListResponse {
  data?: {
    reports?: IncidentLike[];
  };
}

interface SOSListResponse {
  data?: {
    sos?: ISOS[];
  };
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function toCampaignMarkers(raw: CampaignLike[], fallback: string): MapMarker[] {
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

function toIncidentMarkers(raw: IncidentLike[], fallback: string): MapMarker[] {
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

function toSOSMarkers(raw: ISOS[], fallback: string): MapMarker[] {
  return raw
    .filter((s) => {
      const lat = s.latitude ?? s.campaign?.latitude;
      const lng = s.longitude ?? s.campaign?.longitude;
      return lat != null && lng != null;
    })
    .map((s) => ({
      id: String(s.id),
      title: fallback,
      lat: Number(s.latitude ?? s.campaign?.latitude),
      lng: Number(s.longitude ?? s.campaign?.longitude),
      type: 'SOS' as const,
      status: s.status ?? null,
      address: s.detail_address ?? s.campaign?.detail_address ?? null,
      phone: s.phone,
      content: s.content,
    }));
}

// ─── component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<MapMarker[]>([]);
  const [incidents, setIncidents] = useState<MapMarker[]>([]);
  const [sosList, setSosList] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter visibility
  const [showCampaigns, setShowCampaigns] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showSOS, setShowSOS] = useState(true);

  // SOS modal
  const [sosFormOpen, setSosFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [campaignRes, incidentRes, sosRes] = await Promise.allSettled([
      getAllCampaigns({}),
      getAllReports({}),
      getAllSOS({}),
    ]);

    if (campaignRes.status === 'fulfilled') {
      const data = (campaignRes.value as CampaignListResponse)?.data?.campaigns ?? [];
      setCampaigns(toCampaignMarkers(data, t('Untitled Campaign')));
    }

    if (incidentRes.status === 'fulfilled') {
      const data = (incidentRes.value as IncidentListResponse)?.data?.reports ?? [];
      setIncidents(toIncidentMarkers(data, t('Untitled Incident')));
    }

    if (sosRes.status === 'fulfilled') {
      const data = (sosRes.value as SOSListResponse)?.data?.sos ?? [];
      setSosList(toSOSMarkers(data, t('SOS Alert')));
    }

    setLoading(false);
    setLastUpdated(new Date());
  }, [t]);

  // Initial fetch + 10-second auto-refresh
  useEffect(() => {
    void Promise.resolve().then(fetchData);
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // When a new SOS is created, optimistically add it
  const handleSOSCreated = useCallback(
    (sos: ISOS) => {
      const lat = sos.latitude ?? sos.campaign?.latitude;
      const lng = sos.longitude ?? sos.campaign?.longitude;
      if (lat == null || lng == null) return;
      const marker: MapMarker = {
        id: String(sos.id),
        title: t('SOS Alert'),
        lat: Number(lat),
        lng: Number(lng),
        type: 'SOS',
        status: sos.status ?? null,
        address: sos.detail_address ?? sos.campaign?.detail_address ?? null,
        phone: sos.phone,
        content: sos.content,
      };
      setSosList((prev) => [marker, ...prev.filter((s) => s.id !== marker.id)]);
      setShowSOS(true);
    },
    [t],
  );

  const markers = useMemo(() => {
    const result: MapMarker[] = [];
    if (showCampaigns) result.push(...campaigns);
    if (showIncidents) result.push(...incidents);
    if (showSOS) result.push(...sosList);
    return result;
  }, [campaigns, incidents, sosList, showCampaigns, showIncidents, showSOS]);

  return (
    <div className=" h-screen relative overflow-hidden">
      <MapView markers={markers} loading={loading} />

      <FilterPanel
        loading={loading}
        lastUpdated={lastUpdated}
        counts={{
          campaigns: campaigns.length,
          incidents: incidents.length,
          sos: sosList.length,
        }}
        showCampaigns={showCampaigns}
        showIncidents={showIncidents}
        showSOS={showSOS}
        onToggleCampaigns={() => setShowCampaigns((v) => !v)}
        onToggleIncidents={() => setShowIncidents((v) => !v)}
        onToggleSOS={() => setShowSOS((v) => !v)}
      />

      {/* Floating SOS Button */}
      <SOSButton onClick={() => setSosFormOpen(true)} />

      {/* SOS Modal */}
      <SOSForm
        open={sosFormOpen}
        onClose={() => setSosFormOpen(false)}
        onCreated={handleSOSCreated}
      />
    </div>
  );
}

function SOSButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const [isHover, setIsHover] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p >= 1 ? 0 : p + 0.04));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Emergency SOS"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={cn(
        'absolute top-[200px] right-5 z-[1000] flex size-[50px] cursor-pointer select-none items-center justify-center rounded-full border-none bg-red-500 text-[17px] font-bold text-white outline-none transition-all duration-200 ease-out',
        isActive && 'scale-90 bg-red-700',
        !isActive && isHover && 'scale-110 bg-red-600',
        !isActive && !isHover && 'scale-100',
      )}
      style={{
        boxShadow: `0 6px 16px rgba(0,0,0,0.25), 0 0 ${pulse * 25}px rgba(239,68,68,${1 - pulse})`,
      }}
    >
      <span>{t('SOS')}</span>
    </button>
  );
}
