import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetReports } from '@/apis/incident/getReport';
import { IIncident } from '@/apis/incident/models/incident';
import { useGetSavedResources } from '@/apis/saved-resource/getSavedResource';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportSummaryCard from '@/modules/ReportSummaryCard/index';
import { STATUS } from '@/constants/status';
import { Inbox } from 'lucide-react';

import { useCampaign } from '../_hooks/useCampaign';
import { mapResourceToIncident } from '../_services/campaign.service';
import { haversineKm } from '@/constants/campaignLifecycle';

/** Waste points of one meeting point: approved, inside its radius, not picked by another point. */
const IncidentList = memo(function IncidentList({ index }: { index: number }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('explore');
  const { form, takenReportIds, campaign } = useCampaign();
  const REPORTS = `meeting_points.${index}.reports` as const;
  const watchedReports = form.watch(REPORTS);
  const selectedReports = useMemo(() => watchedReports ?? [], [watchedReports]);
  const points = form.watch('meeting_points');
  const point = points[index];
  const radiusKm = Number(point?.radius_km) || 0;
  const reportError = form.formState.errors.meeting_points?.[index]?.reports;

  const setSelectedReports = useCallback(
    (reports: IIncident[]) => {
      form.setValue(REPORTS, reports, { shouldDirty: true });
      form.clearErrors(REPORTS);
    },
    [REPORTS, form],
  );

  const pickedElsewhere = useMemo(
    () =>
      new Set(
        points.flatMap((p, i) => (i === index ? [] : p.reports.map((r) => r.id))),
      ),
    [index, points],
  );
  const hasLocation = point?.latitude != null && point?.longitude != null;

  const reportsQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      status: STATUS.TODO,
      ...(hasLocation
        ? {
            latitude: point?.latitude,
            longitude: point?.longitude,
            max_distance: Math.max(1, Math.round(radiusKm * 1000)),
          }
        : {}),
    }),
    [hasLocation, point?.latitude, point?.longitude, radiusKm],
  );
  const savedQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 20,
      resource_type: 'report',
      sort_by: 'created_at',
      sort_order: 'desc',
    }),
    [],
  );

  const { data: reportsData, isLoading: isReportsLoading } = useGetReports(reportsQueryParams, {
    staleTime: 60_000,
  });
  const { data: savedData, isLoading: isSavedLoading } = useGetSavedResources(savedQueryParams, {
    staleTime: 60_000,
  });

  const isSelectable = useCallback(
    (report: IIncident) => {
      if (pickedElsewhere.has(report.id)) return false;
      // Reports this campaign already holds are no longer TODO, but stay selectable.
      const ownedByThis = campaign?.id && campaign.reports?.some((r) => r.id === report.id);
      if (report.status !== STATUS.TODO && !ownedByThis) return false;
      if (!hasLocation || report.latitude == null || report.longitude == null) return !hasLocation;
      return (
        haversineKm(
          { latitude: point!.latitude as number, longitude: point!.longitude as number },
          { latitude: report.latitude, longitude: report.longitude },
        ) <= radiusKm
      );
    },
    [campaign, hasLocation, pickedElsewhere, point, radiusKm],
  );

  const exploreReports = useMemo(
    () => (reportsData?.data?.reports ?? []).filter(isSelectable),
    [isSelectable, reportsData?.data?.reports],
  );
  const savedReports = useMemo(() => {
    const resources = savedData?.data?.saved_resource;
    const resourceArray = Array.isArray(resources?.items) ? resources?.items : [];
    return resourceArray
      .map((resource) => mapResourceToIncident(resource))
      .filter((report): report is IIncident => Boolean(report))
      .filter(isSelectable);
  }, [isSelectable, savedData?.data]);

  const isLoading = useMemo(
    () => (activeTab === 'explore' ? isReportsLoading : isSavedLoading),
    [activeTab, isReportsLoading, isSavedLoading],
  );

  // Picked reports stay listed first so they can be unpicked, even when already locked.
  const currentReports = useMemo(() => {
    const list = activeTab === 'explore' ? exploreReports : savedReports;
    const picked = new Set(selectedReports.map((r) => r.id));
    return [...selectedReports, ...list.filter((r) => !picked.has(r.id))];
  }, [activeTab, exploreReports, savedReports, selectedReports]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-[20px] px-[24px] py-[24px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-col gap-1">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t('Waste points')} ({selectedReports.length})
        </span>
        <span className="text-xs text-foreground-tertiary">
          {hasLocation
            ? t('Approved waste points within {{km}} km of this meeting point', { km: radiusKm })
            : t('Pick the meeting point location first to see waste points nearby')}
        </span>
        {selectedReports.some((r) => takenReportIds.includes(r.id)) && (
          <span className="text-xs font-medium text-destructive">
            {t('Some waste points were just taken by another campaign. Remove the ones marked in red.')}
          </span>
        )}
        {selectedReports
          .filter((r) => takenReportIds.includes(r.id))
          .map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-fit text-left text-xs text-destructive underline"
              onClick={() => setSelectedReports(selectedReports.filter((x) => x.id !== r.id))}
            >
              {t('Remove')}: {r.title ?? r.id}
            </button>
          ))}
        {reportError?.message && (
          <span className="text-xs font-medium text-destructive">{reportError.message}</span>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10">
          <TabsTrigger
            value="explore"
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t('Explore')}
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
          >
            {t('Saved')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-4">
          <IncidentTabContent
            reports={currentReports}
            isLoading={isLoading}
            selectedReports={selectedReports}
            setSelectedReports={setSelectedReports}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <IncidentTabContent
            reports={currentReports}
            isLoading={isLoading}
            selectedReports={selectedReports}
            setSelectedReports={setSelectedReports}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});

const IncidentTabContent = memo(function IncidentTabContent({
  reports,
  isLoading,
  selectedReports,
  setSelectedReports,
}: {
  reports: IIncident[];
  isLoading: boolean;
  selectedReports: IIncident[];
  setSelectedReports: (reports: IIncident[]) => void;
}) {
  const { t } = useTranslation();

  const emptyState = useMemo(
    () => (
      <div className="flex justify-center py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t('No incidents found')}</EmptyTitle>
            <EmptyDescription>{t('Try another tab or check back later.')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    ),
    [t],
  );

  const loadingState = useMemo(
    () => (
      <div className="space-y-4 flex flex-col sm:grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[320px] w-full rounded-[10px]" />
        ))}
      </div>
    ),
    [],
  );

  const content = useMemo(() => {
    if (isLoading) return loadingState;
    if (!reports.length) return emptyState;

    return (
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
        {reports.map((incident) => (
          <ReportSummaryCard
            key={incident.id}
            incident={incident}
            selectedReports={selectedReports}
            setSelectedReports={setSelectedReports}
          />
        ))}
      </div>
    );
  }, [emptyState, isLoading, loadingState, reports, selectedReports, setSelectedReports]);

  return content;
});

export default IncidentList;
