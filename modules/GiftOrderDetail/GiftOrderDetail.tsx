import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Pill } from '@/components/ui/Pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GIFT_REDEEM_TONE } from '@/constants/statusTone';
import { useUrlTab } from '@/hooks/useUrlTab';
import { OrderHistory } from './components/OrderHistory';
import { OrderInfo } from './components/OrderInfo';
import type { GiftOrderDetailProps } from './types/GiftOrderDetail.types';

const TABS = ['details', 'history'] as const;
// Same tabs as the customer's "My campaigns" page (campaigns/me FormFilter); admin keeps the console look.
const CLIENT_LIST = 'h-12 w-full gap-3 rounded-[5px] border-none bg-[#887A47]/10 sm:w-auto';
const CLIENT_TRIGGER =
  'h-full rounded-[5px] px-4 py-2 transition-all !font-display-1 data-active:bg-background data-active:shadow-sm';

/** One gift order: Details and History tabs, for the customer and the admin (spec 017 US5). */
export const GiftOrderDetail = memo(function GiftOrderDetail({
  order,
  audience,
  actions,
  adminExtra,
  isDark = false,
}: GiftOrderDetailProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useUrlTab(TABS, 'details');
  const isClient = audience !== 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display-3 font-mono font-semibold text-foreground">{order.code}</h2>
        <Pill tone={GIFT_REDEEM_TONE[order.status]} isDark={isDark}>
          {t(order.status)}
        </Pill>
        {actions ? <div className="flex flex-wrap gap-2 sm:ml-auto">{actions}</div> : null}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className={isClient ? CLIENT_LIST : 'h-10 border border-border bg-card'}>
          <TabsTrigger value="details" className={isClient ? CLIENT_TRIGGER : undefined}>
            {t('Details')}
          </TabsTrigger>
          <TabsTrigger value="history" className={isClient ? CLIENT_TRIGGER : undefined}>
            {t('History')} <span className="tabular-nums text-foreground-secondary">({order.events.length})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <OrderInfo order={order} adminExtra={adminExtra} />
        </TabsContent>
        <TabsContent value="history">
          <OrderHistory events={order.events} audience={audience} />
        </TabsContent>
      </Tabs>
    </div>
  );
});

export type { GiftOrderDetailProps, OrderAudience } from './types/GiftOrderDetail.types';
