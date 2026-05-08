'use client';

import { useTranslation } from 'react-i18next';
import { ConfigTabs } from './_components/ConfigTabs';
import { ConfigProvider } from './_context/useConfigContext';
import { BreadcrumbItemProps, Breadcrumbs } from '@/components/client/shared/Breadcrumbs';
import { useMemo } from 'react';

export default function AdminGamificationConfigPage() {
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Admin dashboard'), path: '/admin', type: 'link' },
      { label: t('Config'), path: '/admin/gamification/config', type: 'page' },
    ],
    [t],
  );

  return (
    <ConfigProvider>
      <div className="space-y-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <ConfigTabs />
      </div>
    </ConfigProvider>
  );
}
