import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { IIncident } from '@/apis/incident/models/incident';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

/** `(reportId, fallback?) => title`: the localized title of one of `reports`, else `fallback`, else "Waste point". */
export function useReportTitle(reports: IIncident[] | undefined) {
  const { t } = useTranslation();
  const { title } = useLocalizedDisplay();
  const byId = useMemo(() => new Map((reports ?? []).map((r) => [r.id, r])), [reports]);
  return useCallback(
    (id: string, fallback?: string | null) => {
      const report = byId.get(id);
      return (report && title(report).trim()) || fallback || t('Waste point');
    },
    [byId, t, title],
  );
}
