'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { TbPlayerPlay, TbPencil } from 'react-icons/tb';

import type { ISeason } from '@/apis/gamification/season/models';
import { useFinalizeAdminSeason } from '@/apis/gamification/season/list';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import ChangeStatus from '@/components/ui/ChangeStatus';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSeasonContext } from '../_hooks/useSeasonContext';
import {
  isActiveSeason,
  parseIsoToDate,
  seasonStatusToType,
  toIsoEndOfDay,
  toIsoStartOfDay,
} from '../_services/seasonAdmin.service';

function FinalizeDialog({
  season,
  open,
  onClose,
  onSuccess,
}: {
  season: ISeason | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [openNext, setOpenNext] = useState<'yes' | 'no'>('no');
  const [nextLabel, setNextLabel] = useState('');
  const [startsAt, setStartsAt] = useState<Date | undefined>(undefined);
  const [endsAt, setEndsAt] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useFinalizeAdminSeason({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const dateLabel =
    startsAt && endsAt
      ? `${format(startsAt, 'PPP')} - ${format(endsAt, 'PPP')}`
      : t('Pick a date range');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
    >
      <DialogContent showCloseButton className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Finalize season')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>{t('Season')}</FieldLabel>
            <Input
              disabled
              value={season?.label || season?.id || ''}
              className="h-10 border border-zinc-300"
            />
          </Field>

          <Field>
            <FieldLabel>{t('Open next season?')}</FieldLabel>
            <RadioGroup value={openNext} onValueChange={(v) => setOpenNext(v as 'yes' | 'no')}>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="no" />
                {t('No')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="yes" />
                {t('Yes')}
              </label>
            </RadioGroup>
          </Field>

          {openNext === 'yes' ? (
            <>
              <Field>
                <FieldLabel>{t('Next label')}</FieldLabel>
                <Input
                  value={nextLabel}
                  onChange={(e) => setNextLabel(e.target.value)}
                  placeholder={t('Season 2026-06')}
                  className="h-10 border border-zinc-300"
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel>{t('Next season schedule')}</FieldLabel>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start border-zinc-300 text-left font-normal hover:bg-transparent"
                    onClick={() => setCalendarOpen((prev) => !prev)}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateLabel}
                  </Button>
                  {calendarOpen && (
                    <div className="absolute z-50 mt-2 rounded-md border border-zinc-300 bg-background shadow-md">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        defaultMonth={startsAt ?? parseIsoToDate(season?.endsAt) ?? new Date()}
                        selected={{ from: startsAt, to: endsAt }}
                        onSelect={(range: DateRange | undefined) => {
                          setStartsAt(range?.from);
                          setEndsAt(range?.to);
                        }}
                      />
                    </div>
                  )}
                </div>
              </Field>
            </>
          ) : null}
          <FieldError errors={formError ? [{ message: formError }] : []} />
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="h-[45px] px-4"
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            disabled={isPending || !season}
            className="h-[45px] px-4"
            onClick={() => {
              if (!season) return;
              setFormError(null);

              const willOpenNext = openNext === 'yes';
              if (willOpenNext) {
                if (!startsAt || !endsAt) {
                  setFormError(t('Start and end date are required'));
                  return;
                }
                if (startsAt >= endsAt) {
                  setFormError(t('End date must be after start date'));
                  return;
                }
              }

              const startsAtIso = willOpenNext ? toIsoStartOfDay(startsAt) : undefined;
              const endsAtIso = willOpenNext ? toIsoEndOfDay(endsAt) : undefined;

              void mutateAsync({
                id: season.id,
                openNext: willOpenNext,
                body: willOpenNext
                  ? {
                      nextLabel: nextLabel.trim() || undefined,
                      startsAt: startsAtIso,
                      endsAt: endsAtIso,
                    }
                  : {},
              });
            }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Finalize')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataTable({ onEdit }: { onEdit: (season: ISeason) => void }) {
  const { t } = useTranslation();
  const {
    seasons,
    loading,
    total,
    pagination,
    errorMessage,
    onRetry,
    onPageChange,
    onPageSizeChange,
  } = useSeasonContext();
  const [finalizeSeason, setFinalizeSeason] = useState<ISeason | null>(null);

  const columns: DataTableColumn<ISeason>[] = useMemo(
    () => [
      {
        key: 'no',
        title: t('No'),
        className: 'w-[64px]',
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: 'label',
        title: t('Label'),
        className: 'min-w-[140px]',
        dataIndex: 'label',
      },
      {
        key: 'kind',
        title: t('Kind'),
        className: 'w-[130px]',
        dataIndex: 'kind',
      },
      {
        key: 'status',
        title: t('Status'),
        className: 'w-[120px]',
        render: (_, row) => {
          const statusType = seasonStatusToType(row.status);
          if (!statusType) return row.status || '—';
          return (
            <div className="w-fit">
              <ChangeStatus type={statusType} enabledDropdown={false} />
            </div>
          );
        },
      },
      {
        key: 'duration',
        title: t('Duration'),
        className: 'min-w-[260px]',
        render: (_, row) =>
          `${format(new Date(row.startsAt), 'PPP')} - ${format(new Date(row.endsAt), 'PPP')}`,
      },
      {
        key: 'action',
        title: t('Action'),
        className: 'w-[120px]',
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-zinc-300 px-1.5 py-1.5 text-xs font-medium hover:bg-zinc-100"
              onClick={() => onEdit(row)}
            >
              <TbPencil className="size-5" />
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-zinc-300 px-1.5 py-1.5 text-xs font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setFinalizeSeason(row)}
              disabled={!isActiveSeason(row)}
              title={
                !isActiveSeason(row) ? t('Only ACTIVE seasons can be finalized') : t('Finalize')
              }
            >
              <TbPlayerPlay className="size-5" />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, pagination.current, pagination.pageSize, t],
  );

  return (
    <>
      <SharedDataTable
        columns={columns}
        data={seasons}
        loading={loading}
        error={errorMessage}
        onRetry={onRetry}
        rowKey="id"
        emptyTitle={t('No seasons found')}
        emptyDescription={t('No seasons match the current filters.')}
        pagination={{
          page: pagination.current,
          pageSize: pagination.pageSize,
          total,
          onPageChange,
          onPageSizeChange,
        }}
      />
      <FinalizeDialog
        season={finalizeSeason}
        open={Boolean(finalizeSeason)}
        onClose={() => setFinalizeSeason(null)}
        onSuccess={() => void onRetry()}
      />
    </>
  );
}
