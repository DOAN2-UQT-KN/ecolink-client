import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { useAddShiftMedia } from '@/apis/campaign/addShiftMedia';
import { useEndShiftEarly } from '@/apis/campaign/endShiftEarly';
import { useRemoveShiftMedia } from '@/apis/campaign/removeShiftMedia';
import { useSaveShiftResult } from '@/apis/campaign/saveShiftResult';
import { useShiftResult } from '@/apis/campaign/getShiftResult';
import type { IIncident } from '@/apis/incident/models/incident';
import { Button } from '@/components/client/shared/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { ShiftResultView } from '@/modules/CampaignVerification';
import { useReportTitle } from '../_hooks/useReportTitle';
import { useShiftResultForm } from '../_hooks/useShiftResultForm';
import { ShiftMediaPool } from './ShiftMediaPool';
import { ShiftResultHeader } from './ShiftResultHeader';
import { ShiftResultReportEditor } from './ShiftResultReportEditor';
import { refreshCampaign, refreshShiftOverview } from '../../_services/campaignCache.service';

/**
 * The result of one shift (spec 4.2). Its leader or a campaign manager fills it once the shift
 * has started: each waste point of the meeting point (cleaned / partly done / not handled, with
 * photos before and after), photos picked from the shift's pool, a description and the amount
 * collected; they can end the shift early once a result is saved. Volunteers who attended see it
 * and add their photos to the pool. Everyone else sees the status only.
 */
export const ShiftResultPanel = memo(function ShiftResultPanel({
  campaignId,
  shiftId,
  reports,
  className,
}: {
  campaignId: string;
  shiftId: string;
  /** Waste points of the shift's meeting point. */
  reports: IIncident[];
  className?: string;
}) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const params = { campaign_id: campaignId, shift_id: shiftId };
  const { data, isLoading, isError } = useShiftResult(params);
  const view = data?.data;
  // Everyone sees the result read-only; whoever may edit opens the form with "Edit".
  const [editing, setEditing] = useState(false);

  const refreshAfterChange = () => {
    refreshCampaign(campaignId);
    refreshShiftOverview(campaignId);
  };
  const { mutate: save, isPending: isSaving } = useSaveShiftResult({
    onSuccess: () => {
      refreshAfterChange();
      setEditing(false);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Shift result saved') });
    },
  });
  const { mutateAsync: endEarly, isPending: isEnding } = useEndShiftEarly({
    onSuccess: (res) => {
      refreshAfterChange();
      void queryClient.invalidateQueries({ queryKey: ['shift-attendance'] });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Shift ended; {{n}} person(s) checked out', { n: res.data.checked_out }),
      });
    },
  });
  const { mutateAsync: addMedia } = useAddShiftMedia();
  const { mutate: removeMedia } = useRemoveShiftMedia();

  const form = useShiftResultForm(view);

  const reportById = new Map(reports.map((r) => [r.id, r]));
  const reportTitle = useReportTitle(reports);

  if (isLoading) return <div className={className}>{t('Loading')}…</div>;
  if (isError || !view) return null;

  const status = view.status;
  const started = status !== 'upcoming' && status !== 'off';
  const editable = view.can_edit && !view.locked && started;

  const header = (
    <ShiftResultHeader
      view={view}
      editable={editable}
      editing={editing}
      isEnding={isEnding}
      onEdit={() => {
        form.resetForm();
        setEditing(true);
      }}
      onEndEarly={async () => {
        await endEarly(params);
      }}
    />
  );

  const pool = (
    <ShiftMediaPool
      view={view}
      editing={editing}
      editable={editable}
      picked={form.picked}
      setPicked={form.setPicked}
      onUploaded={async (items) => {
        for (const item of items) await addMedia({ ...params, ...item });
      }}
      onRemove={(mediaId) => removeMedia({ ...params, media_id: mediaId })}
    />
  );

  if (!editable || !editing) {
    return (
      <div className={className}>
        {header}
        <ShiftResultView
          result={view.result}
          reportIds={view.report_ids}
          started={started}
          reportTitle={reportTitle}
        />
        {/* Without can_view the server sends only the photos chosen for the result (public campaign). */}
        {(view.can_view || view.result) && pool}
      </div>
    );
  }

  const onSave = () => {
    const payload = form.toPayload(params);
    if (payload) save(payload);
  };

  return (
    <div className={className}>
      {header}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('Waste points')}</h3>
          {view.report_ids.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">{t('This meeting point has no waste points.')}</p>
          ) : (
            view.report_ids.map((id) => {
              const d = form.drafts[id] ?? { status: 'none' as const, before: [], after: [] };
              return (
                <ShiftResultReportEditor
                  key={id}
                  campaignId={campaignId}
                  shiftId={shiftId}
                  id={id}
                  title={reportTitle(id)}
                  draft={d}
                  saved={view.result?.reports.find((r) => r.report_id === id)}
                  checks={form.checks}
                  incident={reportById.get(id)}
                  setDraft={form.setDraft}
                  onPhotosUploaded={(side, items) => form.addPhotos(id, side, d, items)}
                />
              );
            })
          )}
        </div>

        {pool}

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold">{t('Description')}</span>
            <Textarea
              value={form.description}
              maxLength={5000}
              rows={4}
              placeholder={t('What was done on this shift')}
              onChange={(e) => form.setDescription(e.target.value)}
            />
          </label>
          <div className="grid max-w-md grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{t('Bags')}</span>
              <Input type="number" min={0} step={1} value={form.bags} onChange={(e) => form.setBags(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{t('Weight (kg)')}</span>
              <Input type="number" min={0} step="0.1" value={form.kg} onChange={(e) => form.setKg(e.target.value)} />
            </label>
          </div>
        </div>

        {form.formError && <p className="text-sm text-destructive">{form.formError}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outlined-brown"
            size="medium"
            isDisabled={isSaving}
            onClick={() => {
              form.resetForm();
              setEditing(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button type="button" variant="brown" size="medium" isLoading={isSaving} isDisabled={isSaving} onClick={onSave}>
            {view.result ? t('Save result') : t('Submit result')}
          </Button>
        </div>
      </div>
    </div>
  );
});
