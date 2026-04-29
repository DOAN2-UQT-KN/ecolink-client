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
          <span className="font-bold text-base tracking-tight text-black">
            {t('Incident & Campaign Map')}
          </span>
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-auto opacity-80" />}
        </div>

        {/* live stats */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('Campaigns')}:</span>
            <span style={{ fontWeight: 600, color: '#2563eb' }}>{counts.campaigns}</span>
          </div>

          {/* Incidents */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('Incidents')}:</span>
            <span style={{ fontWeight: 600, color: '#dc2626' }}>{counts.incidents}</span>
          </div>

          {/* SOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                height: '12px',
                width: '12px',
                borderRadius: '50%',
                backgroundColor: '#facc15',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 500, color: '#374151' }}>{t('SOS')}:</span>
            <span style={{ fontWeight: 600, color: '#a16207' }}>{counts.sos}</span>

            {counts.sos > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
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
          </div>
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

      {/* ── legend + filters ── */}
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          {t('Show / Hide')}
        </p>
        <div className="space-y-2.5">
          {/* Campaigns toggle */}
          <FilterRow
            color="bg-blue-600"
            label={t('Campaign')}
            active={showCampaigns}
            onToggle={onToggleCampaigns}
          />
          {/* Incidents toggle */}
          <FilterRow
            color="bg-red-600"
            label={t('Incident')}
            active={showIncidents}
            onToggle={onToggleIncidents}
          />
          {/* SOS toggle */}
          <FilterRow
            color="bg-yellow-400 border border-yellow-500"
            label={`🚨 ${t('SOS')}`}
            active={showSOS}
            onToggle={onToggleSOS}
            highlight
          />
          dsadasd
        </div>
      </div>
    </div>
  );
});

// ─── single filter row ─────────────────────────────────────────────────────────
interface FilterRowProps {
  color: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  highlight?: boolean;
}

const FilterRow = memo(function FilterRow({
  color,
  label,
  active,
  onToggle,
  highlight,
}: FilterRowProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150
        ${active ? 'bg-gray-50 hover:bg-gray-100' : 'opacity-50 hover:opacity-70'}
        ${highlight && active ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
      `}
    >
      <span
        className={`flex-shrink-0 w-5 h-5 rounded-full ${color} flex items-center justify-center`}
      >
        <span className="w-2 h-2 rounded-full bg-white" />
      </span>
      <span className="text-xs text-gray-600 font-medium flex-1 text-left">{label}</span>
      {/* Toggle indicator */}
      <span
        className={`flex-shrink-0 w-7 h-4 rounded-full transition-colors duration-200 relative
          ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200
            ${active ? 'translate-x-3.5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
});

export default FilterPanel;
