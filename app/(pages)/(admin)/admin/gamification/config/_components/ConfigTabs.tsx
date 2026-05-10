'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { ConfigTabKey } from '../_services/config.service';
import { DifficultySettingsTab } from './DifficultySettingsTab';
import { LeaderboardPayoutTab } from './LeaderboardPayoutTab';
import { PointRulesTab } from './PointRulesTab';
import { SpRulesTab } from './SpRulesTab';
import { VolunteerMultipliersTab } from './VolunteerMultipliersTab';

export function ConfigTabs() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, loading } = useConfigContext();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ConfigTabKey)}
      className="space-y-4"
    >
      <TabsList
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
        variant="line"
      >
        <TabsTrigger value="point-rules">{t('Point Rules')}</TabsTrigger>
        <TabsTrigger value="sp-rules">{t('Spendable Points (SP) Rules')}</TabsTrigger>
        <TabsTrigger value="multipliers">{t('Volunteer Multipliers')}</TabsTrigger>
        <TabsTrigger value="difficulty-settings">{t('Difficulty Settings')}</TabsTrigger>
        <TabsTrigger value="payout-tiers">{t('Leaderboard Payout Tiers')}</TabsTrigger>
      </TabsList>

      <div className="rounded-xl border bg-card p-4 md:p-6">
        {loading && (
          <p className="text-sm text-muted-foreground">{t('Loading configuration...')}</p>
        )}
        <TabsContent value="point-rules">
          <PointRulesTab />
        </TabsContent>
        <TabsContent value="sp-rules">
          <SpRulesTab />
        </TabsContent>
        <TabsContent value="multipliers">
          <VolunteerMultipliersTab />
        </TabsContent>
        <TabsContent value="difficulty-settings">
          <DifficultySettingsTab />
        </TabsContent>
        <TabsContent value="payout-tiers">
          <LeaderboardPayoutTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
