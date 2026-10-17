import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HiMapPin } from 'react-icons/hi2';
import { TbStarFilled } from "react-icons/tb";

import { IIncident } from '@/apis/incident/models/incident';
import { openReportOnCardClick } from '@/modules/ReportDetailCard/reportCardNavigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import RichTextContent from '@/components/ui/RichTextContent';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { ReportFacts } from '@/modules/ReportDetailCard/components/ReportFacts';

interface ReportSummaryCardProps {
  incident: IIncident;
  enabledCheckbox?: boolean;
  selectedReports: IIncident[];
  setSelectedReports: (reports: IIncident[]) => void;
}

const ReportSummaryCard = memo(function ReportSummaryCard({
  incident,
  enabledCheckbox = true,
  selectedReports,
  setSelectedReports,
}: ReportSummaryCardProps) {
  const { t } = useTranslation();
  const { title: localizedTitle, description: localizedDescription } =
    useLocalizedDisplay();

  const isChecked = useMemo(
    () => selectedReports.some((report) => report.id === incident.id),
    [incident.id, selectedReports],
  );

  const votePoint = useMemo(
    () => (incident.votes?.upvote_count || 0) - (incident.votes?.downvote_count || 0),
    [incident.votes?.downvote_count, incident.votes?.upvote_count],
  );

  const toggleSelected = useCallback(() => {
    if (isChecked) {
      setSelectedReports(selectedReports.filter((report) => report.id !== incident.id));
      return;
    }
    setSelectedReports([...selectedReports, incident]);
  }, [incident, isChecked, selectedReports, setSelectedReports]);

  const stopCardClick = useCallback((e: React.SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  // Campaign pages open the report in a new tab so the campaign (and its selection) stays put (specs/009).
  const href = `/incidents/${incident.id}`;
  const onCardClick = useCallback(
    (e: React.MouseEvent) => openReportOnCardClick(e, href, () => undefined, true),
    [href],
  );

  return (
        <div
          onClick={onCardClick}
          onAuxClick={onCardClick}
          className={cn(
            'relative w-full border rounded-[10px] bg-white/90 transition-colors cursor-pointer',
            'border-[rgba(136,122,71,0.4)] p-4',
            isChecked ? 'ring-2 ring-button-accent/35' : 'hover:bg-white',
          )}
        >
          {enabledCheckbox && (
            <div
              className="absolute left-3 top-3 z-10"
              onClick={stopCardClick}
              onPointerDown={stopCardClick}
            >
              <Checkbox checked={isChecked} onCheckedChange={toggleSelected} />
            </div>
          )}
          <div className="pl-5 flex flex-col gap-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-black leading-tight line-clamp-2">
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus-visible:underline"
                >
                  {localizedTitle(incident) || t('Untitled report')}
                </Link>
              </h4>
              {incident.detail_address && (
                <div className="flex items-center gap-2 font-display-1 text-foreground-tertiary overflow-hidden">
                  <HiMapPin size={14} />
                  <p className="line-clamp-1 overflow-hidden">{incident.detail_address}</p>
                </div>
              )}
            </div>
            <RichTextContent
              value={localizedDescription(incident)}
              className="!font-display-1 text-foreground-secondary "
              maxLines={2}
              // showMoreLabel={t('See more')}
              // showLessLabel={t('See less')}
              emptyFallback={<span className="text-foreground-secondary">—</span>}
            />{' '}
            {/* <p className="font-display-1 text-foreground-secondary leading-relaxed line-clamp-2 h-[40px] overflow-y-auto scrollbar-hide">
              {incident.description || t('No description provided.')}
            </p> */}
            <ReportFacts incident={incident} compact />
            <div>
              <span className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                <TbStarFilled aria-hidden className="size-4 text-foreground-tertiary" />
                <span className="font-medium text-foreground-primary">{votePoint}</span>
              </span>
            </div>
          </div>
        </div>
  );
});

export default ReportSummaryCard;
