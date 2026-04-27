'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { cn } from '@/libs/utils';

import { CampaignTabs } from './_components/CampaignTabs';
import { CampaignList } from './_components/CampaignList';
import { SearchFilter } from './_components/SearchFilter';
import { CampaignSearchProvider } from './_context/CampaignSearchContext';

const CampaignsSearchPage = memo(function CampaignsSearchPage() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Home'), path: '/', type: 'link' },
      { label: t('Campaigns'), path: '/campaigns', type: 'page' },
    ],
    [t],
  );

  return (
    <CampaignSearchProvider>
      <div className="max-w-7xl mx-auto w-full relative">
        <div
          className={cn(
            'sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20 mb-8',
            isScrolled ? 'pt-[100px]' : 'pt-0',
          )}
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <div className="mt-4">
            <CampaignTabs />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="fixed">
            <SearchFilter />
          </div>
          <div className="w-full min-w-0 flex-1 ml-[320px]">
            <CampaignList />
          </div>
        </div>
      </div>
    </CampaignSearchProvider>
  );
});

export default CampaignsSearchPage;
