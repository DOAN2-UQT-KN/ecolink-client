'use client';

import { useTranslation } from 'react-i18next';



import { BadgesProvider } from './_context/BadgesContext';
import BadgesSummary from './_components/BadgesSummary';
import BadgesFormFilter from './_components/BadgesFormFilter';
import BadgeGrid from './_components/BadgeGrid';

export default function BadgesPage() {
  const { t } = useTranslation();

  return (
    <BadgesProvider>
      <div className="space-y-5">
        {/* Stats summary */}
        <BadgesSummary />

        {/* Filters */}
        <BadgesFormFilter />

        {/* Grid */}
        <BadgeGrid />
      </div>
    </BadgesProvider>
  );
}
