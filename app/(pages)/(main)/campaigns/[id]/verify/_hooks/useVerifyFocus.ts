import { useEffect, useMemo } from 'react';

import type { IMeetingPointView } from '@/apis/campaign/verification';
import { findFocusPoint } from '../_services/verification.service';

/** The meeting point a notification pointed at (`?point=` / `?report=`), scrolled to once the list is there. */
export function useVerifyFocus(
  focusPointParam: string | null,
  focusReport: string | null,
  meetingPoints: IMeetingPointView[] | undefined,
): string | null {
  const focusPoint = useMemo(
    () => findFocusPoint(focusPointParam, focusReport, meetingPoints),
    [focusPointParam, focusReport, meetingPoints],
  );

  const pointCount = meetingPoints?.length ?? 0;
  useEffect(() => {
    if (!focusPoint || pointCount === 0) return;
    const el = document.getElementById(`mp-${focusPoint}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusPoint, pointCount]);

  return focusPoint;
}
