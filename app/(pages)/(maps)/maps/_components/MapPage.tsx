import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from '@/libs/dynamic';
import { useTranslation } from 'react-i18next';
import { cn } from '@/libs/utils';
import { getAllCampaigns } from '@/apis/campaign/getCampaigns';
import { getAllReports } from '@/apis/incident/getReport';
import { getSosList } from '@/apis/sos/getSos';
import type { ISosSummary, SosType } from '@/apis/sos/models/sos';
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import { SOS_OPEN_STATES_PARAM, isSosOpen } from '@/constants/sos';
import useAuthStore from '@/stores/useAuthStore';
import type { SosCampaignOption } from '@/components/sos/SosDialog';
import { MapLoadingFallback } from './MapLoadingFallback';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <MapLoadingFallback compact labelKey="Initialising map…" />
  ),
});
const FilterPanel = dynamic(() => import('./FilterPanel'), { ssr: false });
const SosDialog = dynamic(() => import('@/components/sos/SosDialog'), { ssr: false });

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
  // SOS-specific: the public map only shows the type and the location.
  campaignId?: string | null;
  sosType?: SosType;
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

/** Open SOS only, at the SOS's own coordinates (not the campaign's). */
function toSOSMarkers(raw: ISosSummary[], fallback: string): MapMarker[] {
  return raw
    .filter((s) => isSosOpen(s.state) && s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: String(s.id),
      title: fallback,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      type: 'SOS' as const,
      campaignId: s.campaign_id ?? null,
      sosType: s.type,
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

  // SOS dialog
  const [sosFormOpen, setSosFormOpen] = useState(false);
  const isAuthenticated = useAuthStore((st) => st.is_authenticated);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [campaignRes, incidentRes, sosRes] = await Promise.allSettled([
      getAllCampaigns({}),
      getAllReports({}),
      getSosList({ states: SOS_OPEN_STATES_PARAM, limit: 100 }),
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
      const data = sosRes.value?.data?.items ?? [];
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

  // The floating button asks for one of the running campaigns (no "all campaigns").
  const runningCampaigns = useMemo<SosCampaignOption[]>(
    () =>
      campaigns
        .filter((c) => c.status === CAMPAIGN_STATUS.ACTIVE)
        .map((c) => ({ id: c.id, title: c.title })),
    [campaigns],
  );

  const markers = useMemo(() => {
    const result: MapMarker[] = [];
    const campaignIdsWithSOS = new Set(
      sosList
        .map((sos) => sos.campaignId)
        .filter((campaignId): campaignId is string => Boolean(campaignId)),
    );
    const campaignsWithoutSOS = campaigns.filter(
      (campaign) => !campaignIdsWithSOS.has(campaign.id),
    );

    // If campaign already has SOS linked by campaign_id, render only SOS marker.
    if (showCampaigns) result.push(...campaignsWithoutSOS);
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

      {/* Floating SOS Button: eligibility is checked in the dialog once a campaign is chosen. */}
      {isAuthenticated && <SOSButton onClick={() => setSosFormOpen(true)} />}

      <SosDialog
        open={sosFormOpen}
        onOpenChange={setSosFormOpen}
        campaignOptions={runningCampaigns}
      />
    </div>
  );
}

function SOSButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const [isHover, setIsHover] = useState(false);
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('Emergency SOS')}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={cn(
        'absolute top-[200px] right-5 z-[1000] flex size-[50px] cursor-pointer select-none items-center justify-center rounded-full border-none bg-red-500 text-[17px] font-bold text-white outline-none transition-all duration-200 ease-out shadow-[0_6px_16px_rgba(0,0,0,0.25)]',
        isActive && 'scale-90 bg-red-700',
        !isActive && isHover && 'scale-110 bg-red-600',
        !isActive && !isHover && 'scale-100',
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40"
        aria-hidden
      />
      <span className="relative">{t('SOS')}</span>
    </button>
  );
}
