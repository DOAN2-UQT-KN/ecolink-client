'use client';

import FormFilter from './_components/FormFilter';
import MyPoints from './_components/MyPoints';
import TransactionHistory from './_components/TransactionHistory';
import { PointsProvider } from './_context/PointsContext';

export default function PointsPage() {
  return (
    <PointsProvider>
      <div className="space-y-4">
        <MyPoints />
        <FormFilter />
        <TransactionHistory />
      </div>
    </PointsProvider>
  );
}
