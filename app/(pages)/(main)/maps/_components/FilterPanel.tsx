'use client';

import { memo } from 'react';
import { Map, RefreshCw, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── filter panel ──────────────────────────────────────────────────────────────
interface FilterPanelProps {
  loading: boolean;
  lastUpdated: Date | null;
  counts: { campaigns: number; incidents: number; sos: number };
  showCampaigns: boolean;
  showIncidents: boolean;
  showSOS: boolean;
  onToggleCampaigns: () => void;
  onToggleIncidents: () => void;
  onToggleSOS: () => void;
}

const FilterPanel = memo(function FilterPanel({
  loading,
  lastUpdated,
  counts,
  showCampaigns,
  showIncidents,
  showSOS,
  onToggleCampaigns,
  onToggleIncidents,
  onToggleSOS,
}: FilterPanelProps) {
  const { t } = useTranslation();

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="absolute top-4 right-4 z-[1000] w-64 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white/95 backdrop-blur-md">
      {/* ── header ── */}
      <div className="px-5 py-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Map className="h-4 w-4 flex-shrink-0" />
          <span className="font-bold text-base  text-black">{t('Incident & Campaign Map')}</span>
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-auto opacity-80" />}
        </div>

        {/* live stats — click each row to show/hide that layer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingLeft: '20px',
            fontSize: '11px',
          }}
        >
          {/* Campaigns */}
          <button
            onClick={onToggleCampaigns}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              padding: '3px 4px',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: showCampaigns ? 1 : 0.45,
              transition: 'opacity 0.2s',
              textAlign: 'left',
            }}
          >
            {/* <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'inline-block',
                flexShrink: 0,
              }}
            /> */}
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('Campaigns')}:</span>
            <span style={{ fontWeight: 600, color: '#2563eb' }}>{counts.campaigns}</span>
            <ToggleSwitch active={showCampaigns} color="#3b82f6" />
          </button>

          {/* Incidents */}
          <button
            onClick={onToggleIncidents}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              padding: '3px 4px',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: showIncidents ? 1 : 0.45,
              transition: 'opacity 0.2s',
              textAlign: 'left',
            }}
          >
            {/* <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                display: 'inline-block',
                flexShrink: 0,
              }}
            /> */}
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('Incidents')}:</span>
            <span style={{ fontWeight: 600, color: '#dc2626' }}>{counts.incidents}</span>
            <ToggleSwitch active={showIncidents} color="#ef4444" />
          </button>

          {/* SOS */}
          <button
            onClick={onToggleSOS}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              padding: '3px 4px',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: showSOS ? 1 : 0.45,
              transition: 'opacity 0.2s',
              textAlign: 'left',
            }}
          >
            {/* <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#facc15',
                display: 'inline-block',
                flexShrink: 0,
              }}
            /> */}
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('SOS')}:</span>
            <span style={{ fontWeight: 600, color: '#a16207' }}>{counts.sos}</span>
            {counts.sos > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                {t('LIVE')}
              </span>
            )}
            <ToggleSwitch active={showSOS} color="#facc15" />
          </button>
        </div>

        {formattedTime && (
          <p
            style={{
              fontSize: '10px',
              color: '#6b7280', // tương đương text-foreground-secondary (gray-500)
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              paddingLeft: '20px',
            }}
          >
            <Activity
              style={{
                width: '12px',
                height: '12px',
                color: '#ef4444', // red-500
              }}
            />
            {t('Map updated at {{time}}', { time: formattedTime })}
          </p>
        )}
      </div>
    </div>
  );
});

// ─── mini toggle switch ────────────────────────────────────────────────────────
function ToggleSwitch({ active, color }: { active: boolean; color: string }) {
  return (
    <span
      style={{
        marginLeft: 'auto',
        flexShrink: 0,
        width: '28px',
        height: '16px',
        borderRadius: '9999px',
        backgroundColor: active ? color : '#d1d5db',
        position: 'relative',
        display: 'inline-block',
        transition: 'background-color 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: active ? '14px' : '2px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 0.2s',
        }}
      />
    </span>
  );
}

export default FilterPanel;
