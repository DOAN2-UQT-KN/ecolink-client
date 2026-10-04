import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ADMIN_ROLE_ID } from '@/constants/roles';
import useAuthStore from '@/stores/useAuthStore';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { CampaignRegistrations } from './CampaignRegistrations';
import { DetailInformation } from './DetailInformation';
import { ShiftProgressCard } from './ShiftProgressCard';

const ALL_CAMPAIGN_TAB_ITEMS = [
  { value: 'detail', labelKey: 'Detail information' },
  { value: 'progress', labelKey: 'Progress' },
  { value: 'registrations', labelKey: 'Registrations' },
] as const;

export type CampaignTabValue = (typeof ALL_CAMPAIGN_TAB_ITEMS)[number]['value'];


export const CampaignTabs = memo(function CampaignTabs() {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<CampaignTabValue>('detail');
  const { campaign, canManageCampaign } = useCampaignDetail();
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);
  // Progress (spec 4.2): managers and admins only, same as the shift-overview API.
  const canSeeProgress = Boolean(campaign) && (canManageCampaign || isPlatformAdmin);

  // Registrations is open to everyone: names only for those allowed (CampaignRegistrations).
  const tabItems = ALL_CAMPAIGN_TAB_ITEMS.filter((item) => item.value !== 'progress' || canSeeProgress);
  const activeTab: CampaignTabValue = tab === 'progress' && !canSeeProgress ? 'detail' : tab;

  return (
    <Tabs value={activeTab} onValueChange={(v) => setTab(v as CampaignTabValue)}>
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
      {canSeeProgress && campaign && (
        <TabsContent value="progress" className="mt-0">
          <ShiftProgressCard campaign={campaign} />
        </TabsContent>
      )}
      <TabsContent value="registrations" className="mt-0">
        <CampaignRegistrations enabled={tab === 'registrations'} />
      </TabsContent>
    </Tabs>
  );
});
