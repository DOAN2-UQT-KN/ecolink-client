import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CampaignRegistrations } from './CampaignRegistrations';
import { CampaignTask } from './CampaignTask';
import { DetailInformation } from './DetailInformation';

const ALL_CAMPAIGN_TAB_ITEMS = [
  { value: 'detail', labelKey: 'Detail information' },
  { value: 'tasks', labelKey: 'Tasks' },
  { value: 'registrations', labelKey: 'Registrations' },
] as const;

export type CampaignTabValue = (typeof ALL_CAMPAIGN_TAB_ITEMS)[number]['value'];


export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<CampaignTabValue>('detail');

  // Registrations is open to everyone: names only for those allowed (CampaignRegistrations).
  const tabItems = ALL_CAMPAIGN_TAB_ITEMS;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as CampaignTabValue)}>
      <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
        {tabItems.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t(item.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="detail" className="mt-0">
        <DetailInformation />
      </TabsContent>
      <TabsContent value="tasks" className="mt-0">
        <CampaignTask />
      </TabsContent>
      <TabsContent value="registrations" className="mt-0">
        <CampaignRegistrations enabled={tab === 'registrations'} />
      </TabsContent>
    </Tabs>
  );
});
