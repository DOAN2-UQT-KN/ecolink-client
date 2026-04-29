'use client';

import { memo } from 'react';
import { Map, RefreshCw, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── filter panel ──────────────────────────────────────────────────────────────
interface FilterPanelProps {
  loading: boolean;
  lastUpdated: Date | null;
  counts: { campaigns: number; incidents: number };
}

const FilterPanel = memo(function FilterPanel({ loading, lastUpdated, counts }: FilterPanelProps) {
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
        <div className="flex items-center gap-4 px-4 py-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500 inline-block" />
            <span className="font-medium text-gray-700">{t('Campaigns')}:</span>
            <span className="font-semibold text-blue-600">{counts.campaigns}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
            <span className="font-medium text-gray-700">{t('Incidents')}:</span>
            <span className="font-semibold text-red-600">{counts.incidents}</span>
          </div>
        </div>

        {formattedTime && (
          <p className="text-[10px] text-foreground-secondary mt-1.5 flex items-center gap-1 pl-5">
            <Activity className="h-3 w-3 text-red-500" />
            {t('Map updated at {{time}}', { time: formattedTime })}
          </p>
        )}
      </div>

      {/* ── legend ── */}
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          {t('Legend')}
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            <span className="text-xs text-gray-600 font-medium">{t('Campaign')}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            <span className="text-xs text-gray-600 font-medium">{t('Incident')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterPanel;
