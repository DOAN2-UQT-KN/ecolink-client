'use client';

import { useContext } from 'react';

import { BadgesContext } from '../_context/BadgesContext';

export default function useBadgesContext() {
  const context = useContext(BadgesContext);

  if (!context) {
    throw new Error('useBadgesContext must be used within BadgesProvider');
  }

  return context;
}
