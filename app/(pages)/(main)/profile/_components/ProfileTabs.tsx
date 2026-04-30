'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type TabValue = 'account' | 'points';

const TAB_ROUTE: Record<TabValue, string> = {
  account: '/profile/account',
  points: '/profile/points',
};

const TABS: Array<{ value: TabValue; label: string }> = [
  { value: 'account', label: 'Account' },
  { value: 'points', label: 'Points' },
];

export function ProfileTabs() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const activeTab: TabValue = pathname.includes('/profile/points') ? 'points' : 'account';

  return (
    <nav
      aria-label={t('Profile sections')}
      className="flex w-[200px] flex-col gap-2 rounded-[8px] border border-[rgba(136,122,71,0.5)] bg-background-primary/10 p-2 md:flex-col"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={TAB_ROUTE[tab.value]}
          className={`rounded-[8px] px-4 py-2 transition-all !font-display-2 ${
            activeTab === tab.value
              ? 'bg-background border border-[rgba(136,122,71,0.5)]'
              : 'hover:bg-background/60'
          }`}
        >
          {t(tab.label)}
        </Link>
      ))}
    </nav>
  );
}
