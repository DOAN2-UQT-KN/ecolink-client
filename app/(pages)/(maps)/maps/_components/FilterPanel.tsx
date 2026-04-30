'use client';

import { memo, type ReactNode } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { cn } from '@/libs/utils';
import { useTranslation } from 'react-i18next';

type ToggleVariant = 'campaign' | 'incident' | 'sos';

type LayerRowConfig = {
  id: string;
  label: string;
  count: number;
  active: boolean;
  onToggle: () => void;
  variant: ToggleVariant;
  countClassName: string;
  trailing?: ReactNode;
};

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

  const layerRows: LayerRowConfig[] = [
    {
      id: 'campaigns',
      label: t('Campaigns'),
      count: counts.campaigns,
      active: showCampaigns,
      onToggle: onToggleCampaigns,
      variant: 'campaign',
      countClassName: 'text-blue-600',
    },
    {
      id: 'incidents',
      label: t('Incidents'),
      count: counts.incidents,
      active: showIncidents,
      onToggle: onToggleIncidents,
      variant: 'incident',
      countClassName: 'text-yellow-600',
    },
    {
      id: 'sos',
      label: t('SOS'),
      count: counts.sos,
      active: showSOS,
      onToggle: onToggleSOS,
      variant: 'sos',
      countClassName: 'text-red-600',
    },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] w-64 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white/95 backdrop-blur-md">
      {/* ── header ── */}
      <div className="px-5 py-4 text-black flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-base  text-black">{t('Incident & Campaign Map')}</span>
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-auto opacity-80" />}
        </div>

        {/* live stats — click each row to show/hide that layer */}
        <div className="flex flex-col gap-1 text-[11px]">
          {layerRows.map(
            ({
              id,
              label,
              count,
              active,
              onToggle,
              variant,
              countClassName,
              trailing: _trailing,
            }) => (
              <button
                key={id}
                type="button"
                onClick={onToggle}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border-none bg-transparent py-[3px] px-1 text-left transition-opacity duration-200',
                  active ? 'opacity-100' : 'opacity-[0.45]',
                )}
              >
                <div className="flex items-start gap-2">
                  <ToggleSwitch active={active} variant={variant} />
                  <span className="font-medium text-gray-700 w-[80px]">{label}:</span>
                  <span className={cn('font-semibold', countClassName)}>{count}</span>
                </div>
                {/* {trailing} */}
              </button>
            ),
          )}
        </div>

        {formattedTime && (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500">
            {/* <Activity className="size-3 shrink-0 text-red-500" aria-hidden /> */}
            {t('Map updated at {{time}}', { time: formattedTime })}
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-600 animate-pulse">
              {t('LIVE')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
});

// ─── mini toggle switch ────────────────────────────────────────────────────────
const toggleTrackActive: Record<ToggleVariant, string> = {
  campaign: 'bg-blue-500',
  incident: 'bg-yellow-400',
  sos: 'bg-red-500',
};

function ToggleSwitch({ active, variant }: { active: boolean; variant: ToggleVariant }) {
  return (
    <span
      className={cn(
        'relative ml-auto inline-block h-4 w-7 shrink-0 rounded-full transition-colors duration-200',
        active ? toggleTrackActive[variant] : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-md transition-[left] duration-200',
          active ? 'left-[14px]' : 'left-0.5',
        )}
      />
    </span>
  );
}

export default FilterPanel;
