import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

import { CampaignRegistrations } from './CampaignRegistrations';
import { CampaignTask } from './CampaignTask';
import { CurrentMember } from './CurrentMember';
import { DetailInformation } from './DetailInformation';

const ALL_CAMPAIGN_TAB_ITEMS = [
  { value: 'detail', labelKey: 'Detail information' },
  { value: 'members', labelKey: 'Member list' },
  { value: 'tasks', labelKey: 'Tasks' },
  { value: 'registrations', labelKey: 'Registrations' },
] as const;

export type CampaignTabValue = (typeof ALL_CAMPAIGN_TAB_ITEMS)[number]['value'];

const CAMPAIGN_TAB_ITEMS_PUBLIC = ALL_CAMPAIGN_TAB_ITEMS.filter(
  (item) => item.value !== 'registrations',
);

export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation('common');
  const { canManageCampaign } = useCampaignDetail();
  const [tab, setTab] = useState<CampaignTabValue>('detail');

  const tabItems = useMemo(() => {
    return canManageCampaign ? [...ALL_CAMPAIGN_TAB_ITEMS] : [...CAMPAIGN_TAB_ITEMS_PUBLIC];
  }, [canManageCampaign]);

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
      <TabsContent value="members" className="mt-0">
        <CurrentMember />
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
