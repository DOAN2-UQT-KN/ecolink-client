import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbSos } from 'react-icons/tb';

import { useSosEligibility } from '@/apis/sos/getSosEligibility';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SOS_INELIGIBLE_REASON } from '@/constants/sos';
import { useGeoPosition } from '@/hooks/useGeoPosition';
import { cn } from '@/libs/utils';
import useAuthStore from '@/stores/useAuthStore';

import { SosDialog, type SosCampaignOption } from './SosDialog';

/**
 * The SOS entry point of a campaign / shift screen, shown according to `GET /sos/eligibility`.
 * A resident whose browser has not shared GPS yet still sees it: the dialog asks for the
 * location and re-checks. With `shiftId`, it only shows when that shift is one the viewer can
 * raise on (volunteer checked in, or its leader).
 */
export function SosButton({
  campaignId,
  shiftId,
  className,
  wrapperClassName,
  label,
}: {
  campaignId: string;
  shiftId?: string;
  className?: string;
  /** Wraps the button in a div with this class, only when it is shown. */
  wrapperClassName?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const [open, setOpen] = useState(false);
  const { position, status } = useGeoPosition();

  const params = useMemo(
    () => ({
      campaign_id: campaignId,
      ...(position ? { latitude: position.lat, longitude: position.lng } : {}),
    }),
    [campaignId, position],
  );
  // Wait for the silent GPS read so the request is not sent twice.
  const { data } = useSosEligibility(params, {
    enabled: isAuthenticated && Boolean(campaignId) && status !== 'pending',
  });
  const eligibility = data?.data;
  if (!isAuthenticated || !eligibility) return null;

  const onThisShift = !shiftId || eligibility.shifts.some((s) => s.id === shiftId);
  const canOpen =
    (eligibility.can_raise && onThisShift) ||
    (!shiftId && !position && eligibility.reason === 'location_required');
  const blockedByProfile =
    !shiftId && (eligibility.reason === 'email_unverified' || eligibility.reason === 'phone_missing');
  if (!canOpen && !blockedByProfile) return null;

  const button = (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => setOpen(true)}
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <TbSos className="size-5" aria-hidden />
      {label ?? t('Send SOS')}
    </button>
  );

  const content = (
    <>
      {blockedByProfile && eligibility.reason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>{t(SOS_INELIGIBLE_REASON[eligibility.reason])}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <SosDialog open={open} onOpenChange={setOpen} campaignId={campaignId} shiftId={shiftId} />
    </>
  );
  return wrapperClassName ? <div className={wrapperClassName}>{content}</div> : content;
}

export type { SosCampaignOption };
export default SosButton;
