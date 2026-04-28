'use client';

import { useContext } from 'react';

import { PointsContext } from '../_context/PointsContext';

export default function usePointsContext() {
  const context = useContext(PointsContext);

  if (!context) {
    throw new Error('usePointsContext must be used within PointsProvider');
  }

  return context;
}
