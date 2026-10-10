import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TbFlagCheck, TbPencil } from 'react-icons/tb';

import type { IShiftResultView } from '@/apis/campaign/models/shiftResult';
import { Button } from '@/components/client/shared/Button';
import { ConfirmPopoverModal } from '@/components/client/shared/ConfirmPopoverModal';
import { ShiftReopenedNotice, ShiftReopenedPill, ShiftStatusPill } from '@/modules/CampaignVerification';
import { hhmm } from '@/utils/campaignLabels';

/** Title, status and timestamps of the shift result, with "Edit" and "End shift early". */
export function ShiftResultHeader({
  view,
  editable,
  editing,
  isEnding,
  onEdit,
  onEndEarly,
}: {
  view: IShiftResultView;
  editable: boolean;
  editing: boolean;
  isEnding: boolean;
  onEdit: () => void;
  onEndEarly: () => Promise<void>;
}) {
  const { t } = useTranslation('common');
  const status = view.status;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display-6 font-semibold text-button-accent">{t('Shift result')}</h2>
          <ShiftStatusPill status={status} />
          {view.reopened_at && <ShiftReopenedPill reason={view.reopen_reason} />}
        </div>
        {view.ended_at && (
          <span className="text-xs text-foreground-tertiary">
            {t('Ended early at {{time}}', { time: hhmm(view.ended_at) })}
          </span>
        )}
        {view.result && (
          <span className="text-xs text-foreground-tertiary">
            {t('Last saved {{time}}', { time: format(new Date(view.result.updated_at), 'PPp') })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
      {editable && !editing && (
        <Button
          type="button"
          variant="brown"
          size="medium"
          iconLeft={<TbPencil className="size-4" aria-hidden />}
          onClick={onEdit}
        >
          {view.result ? t('Edit') : t('Submit result')}
        </Button>
      )}
      {editable && status === 'running' && view.result && (
        <ConfirmPopoverModal
          title={t('End this shift now?')}
          description={t(
            'The shift ends now: attendance closes and everyone still checked in is checked out. The 60% presence rule counts until now.',
          )}
          confirmLabel={t('End shift')}
          cancelLabel={t('Cancel')}
          confirmPending={isEnding}
          onConfirm={onEndEarly}
          trigger={
            <Button
              type="button"
              variant="outlined-brown"
              size="medium"
              iconLeft={<TbFlagCheck className="size-4" aria-hidden />}
            >
              {t('End shift early')}
            </Button>
          }
        />
      )}
      </div>
      {view.reopened_at && <ShiftReopenedNotice reason={view.reopen_reason} className="w-full" />}
    </div>
  );
}
