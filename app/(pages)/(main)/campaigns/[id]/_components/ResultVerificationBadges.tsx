import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ILayer1,
  ILayer1Issue,
  IResultPhotoCheck,
  Layer1IssueCode,
  ResultCheckLevel,
} from '@/apis/campaign/shiftResult';
import type {
  MeetingPointStatus,
  MeetingPointWeightReason,
  VerificationTrashPointStatus,
} from '@/apis/campaign/verification';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/libs/utils';

type T = (key: string, options?: Record<string, unknown>) => string;

export const CHECK_LEVEL_TONE: Record<ResultCheckLevel, PillTone> = { pass: 'green', warn: 'amber', fail: 'red' };
/** English labels; translate with `t()`. */
export const CHECK_LEVEL_LABEL: Record<ResultCheckLevel, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Fail',
};

export const MEETING_POINT_STATUS_TONE: Record<MeetingPointStatus, PillTone> = {
  voting: 'blue',
  verified: 'green',
  flagged: 'orange',
  rejected: 'red',
};
export const MEETING_POINT_STATUS_LABEL: Record<MeetingPointStatus, string> = {
  voting: 'Voting',
  verified: 'Verified',
  flagged: 'Flagged',
  rejected: 'Not accepted',
};

/** How the submission declared a trash point. */
export const TRASH_POINT_RESULT_TONE: Record<VerificationTrashPointStatus, PillTone> = {
  cleaned: 'green',
  partial: 'amber',
  unhandled: 'red',
};
export const TRASH_POINT_RESULT_LABEL: Record<VerificationTrashPointStatus, string> = {
  cleaned: 'Cleaned',
  partial: 'Partly done',
  unhandled: 'Not handled',
};

/** Why a vote weighs what it does. */
export const WEIGHT_REASON_LABEL: Record<MeetingPointWeightReason, string> = {
  reporter: 'Reported a waste point here',
  on_site: 'On site (within 30 m)',
  nearby: 'Nearby (within 5 km)',
  zero_new_account: 'Account younger than 7 days, does not count',
  zero_unverified: 'Email not verified, does not count',
  zero_far: 'Too far away or no location, does not count',
};

const ISSUE_LABEL: Record<Layer1IssueCode, string> = {
  photo_fail: 'A photo failed its checks',
  photo_warn: 'A photo has warnings',
  legacy_photo: 'A photo was saved before photos were checked',
  before_not_earlier: 'The photo before was not taken earlier than the photo after',
  before_after_same: 'The same file is used before and after',
  hash_reused: 'A photo was already used for another waste point or campaign',
};

/** The checks a photo did not pass, as sentences. */
export function photoCheckProblems(check: IResultPhotoCheck | null | undefined, t: T): string[] {
  if (!check) return [t('Saved before photos were checked')];
  const out: string[] = [];
  if (check.time_check === 'warn') out.push(t('No capture time in the photo'));
  if (check.time_check === 'fail') out.push(t('Not taken within the 48 hours before the upload'));
  if (check.exif_location_check === 'warn') out.push(t('No GPS location in the photo'));
  if (check.exif_location_check === 'fail')
    out.push(t("The photo's location is {{m}} m from the pin (max 100 m)", { m: Math.round(check.exif_distance_m ?? 0) }));
  if (check.pin_check === 'warn') out.push(t('The waste point has no location to compare the pin with'));
  if (check.pin_check === 'fail')
    out.push(t('The pin is {{m}} m from the waste point (max 100 m)', { m: Math.round(check.pin_distance_m ?? 0) }));
  return out;
}

/** Problems of a single photo, already told by its badge's tooltip. */
const PHOTO_ISSUE_CODES = new Set<string>(['photo_fail', 'photo_warn', 'legacy_photo']);

export function layer1IssueText(issue: ILayer1Issue, t: T): string {
  const text = t(ISSUE_LABEL[issue.code] ?? issue.code);
  if (!issue.side) return text;
  return `${t(issue.side === 'before' ? 'Before' : 'After')} · ${text}`;
}

/** Pass / warning / fail of one photo; the checks it missed show on hover. */
export const PhotoCheckBadge = memo(function PhotoCheckBadge({
  check,
  isDark,
  className,
}: {
  /** null: saved before photos were checked (counts as a warning). */
  check: IResultPhotoCheck | null;
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const level: ResultCheckLevel = check?.level ?? 'warn';
  const problems = photoCheckProblems(check, t);
  const pill = (
    <Pill tone={CHECK_LEVEL_TONE[level]} isDark={isDark} className={cn('px-1.5 text-[10px]', className)} tabIndex={0}>
      {t(CHECK_LEVEL_LABEL[level])}
    </Pill>
  );
  if (problems.length === 0) return pill;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{pill}</TooltipTrigger>
      <TooltipContent className="max-w-64">
        <ul className="list-disc space-y-0.5 pl-4 text-xs">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
});

/** "Photo check" and a Layer 1 level (a trash point's, or a meeting point's worst). */
export const Layer1LevelBadge = memo(function Layer1LevelBadge({
  level,
  isDark,
  className,
}: {
  level: ResultCheckLevel;
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5 text-xs', className)}>
      <span className={isDark ? 'text-zinc-400' : 'text-foreground-tertiary'}>{t('Photo check')}</span>
      <Pill tone={CHECK_LEVEL_TONE[level]} isDark={isDark}>
        {t(CHECK_LEVEL_LABEL[level])}
      </Pill>
    </span>
  );
});

/** Layer 1 grade of a trash point and, optionally, what pulled it down. */
export const Layer1Summary = memo(function Layer1Summary({
  layer1,
  showIssues = true,
  photoIssues = false,
  isDark,
  className,
}: {
  layer1: ILayer1;
  showIssues?: boolean;
  /** Also list a photo's own problems; off where the photos show with badges (hover tells them). */
  photoIssues?: boolean;
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const issues = [
    ...new Set(
      layer1.issues.filter((i) => photoIssues || !PHOTO_ISSUE_CODES.has(i.code)).map((i) => layer1IssueText(i, t)),
    ),
  ];
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Layer1LevelBadge level={layer1.level} isDark={isDark} />
      {showIssues && issues.length > 0 && (
        <ul className={cn('list-disc pl-5 text-xs', isDark ? 'text-zinc-300' : 'text-foreground-secondary')}>
          {issues.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
});

export const MeetingPointStatusPill = memo(function MeetingPointStatusPill({
  status,
  isDark,
  className,
}: {
  status: MeetingPointStatus;
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <Pill tone={MEETING_POINT_STATUS_TONE[status]} isDark={isDark} className={className}>
      {t(MEETING_POINT_STATUS_LABEL[status])}
    </Pill>
  );
});

/** How the submission declared a trash point: cleaned, partly done or not handled. */
export const TrashPointResultPill = memo(function TrashPointResultPill({
  status,
  isDark,
  className,
}: {
  status: VerificationTrashPointStatus;
  isDark?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <Pill tone={TRASH_POINT_RESULT_TONE[status]} isDark={isDark} className={className}>
      {t(TRASH_POINT_RESULT_LABEL[status])}
    </Pill>
  );
});

/** The display name of a meeting point: its name, or "Meeting point #n" (n from 1). */
export function meetingPointLabel(name: string | null | undefined, index: number, t: T): string {
  return name?.trim() || t('Meeting point #{{n}}', { n: index + 1 });
}

/** url → its check, from a trash point's Layer 1. */
export function checksByUrl(layer1: ILayer1 | null | undefined): Map<string, IResultPhotoCheck | null> {
  return new Map((layer1?.photos ?? []).map((p) => [p.url, p.check]));
}
