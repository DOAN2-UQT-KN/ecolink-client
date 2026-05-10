'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MetricValue, ScopeValue } from './types';

type MetricTabsProps = {
  metric: MetricValue;
  scope: ScopeValue;
  onMetricChange: (metric: MetricValue) => void;
  onScopeChange: (scope: ScopeValue) => void;
};

const metricOptions: { label: string; value: MetricValue }[] = [
  { label: 'CRP', value: 'crp' },
  { label: 'VRP', value: 'vrp' },
  { label: 'ORG', value: 'org_aggregate' },
];

const scopeOptions: { label: string; value: ScopeValue }[] = [
  { label: 'Global', value: 'global' },
  { label: 'My Rank', value: 'my_rank' },
];

export default function MetricTabs({
  metric,
  scope,
  onMetricChange,
  onScopeChange,
}: MetricTabsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background p-4 shadow-primary-100 md:flex-row md:items-center md:justify-between">
      <Tabs
        value={metric}
        onValueChange={(value) => onMetricChange(value as MetricValue)}
        className="w-full md:w-auto"
      >
        <TabsList className="bg-[#887A47]/10 border-none h-12 rounded-[5px] w-full md:w-auto overflow-x-auto overflow-y-hidden no-scrollbar gap-3">
          {metricOptions.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:text-button-accent data-active:shadow-sm transition-all !font-display-1"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs
        value={scope}
        onValueChange={(value) => onScopeChange(value as ScopeValue)}
        className="w-full md:w-auto"
      >
        <TabsList className="bg-[#887A47]/10 border-none h-12 rounded-[5px] w-full md:w-auto overflow-x-auto overflow-y-hidden no-scrollbar gap-3">
          {scopeOptions.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="rounded-[5px] px-4 py-2 h-full data-active:bg-background data-active:text-button-accent data-active:shadow-sm transition-all !font-display-1"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
