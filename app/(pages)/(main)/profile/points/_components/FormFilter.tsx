'use client';

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import usePointsContext from '../_hooks/usePointsContext';
import { POINTS_FILTER_TABS, type PointsFilterTab } from '../_services/points.service';

const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { tab, setTab } = usePointsContext();

  const handleTabChange = useCallback(
    (value: string) => {
      setTab((value as PointsFilterTab) ?? 'all');
    },
    [setTab],
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10">
        {POINTS_FILTER_TABS.map((filterTab) => (
          <TabsTrigger
            key={filterTab}
            value={filterTab}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {filterTab === 'all'
              ? t('All transactions')
              : filterTab === 'earned'
                ? t('Earned')
                : t('Spent')}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
});

export default FormFilter;
