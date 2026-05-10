'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { TbPencil, TbX } from 'react-icons/tb';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { PointRulesData } from '../_services/config.service';
import { ConfirmApplyDialog } from './ConfirmApplyDialog';

export function PointRulesTab() {
  const { t } = useTranslation();
  const { pointRules, savePointRules, loading } = useConfigContext();
  const [milestoneInput, setMilestoneInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<PointRulesData | null>(null);
  const [editingVolunteerCard, setEditingVolunteerCard] = useState(false);
  const [editingCitizenCard, setEditingCitizenCard] = useState(false);
  const defaultPointRules: PointRulesData = pointRules ?? {
    baseReportPoint: 0,
    reportMilestoneThresholds: [],
    volunteerBonusCapByDifficulty: {},
  };
  const form = useForm<PointRulesData>({
    defaultValues: defaultPointRules,
  });
  const lastPointRulesSnapshotRef = useRef<string>('');

  useEffect(() => {
    const snapshot = JSON.stringify(defaultPointRules);
    if (snapshot === lastPointRulesSnapshotRef.current) return;
    lastPointRulesSnapshotRef.current = snapshot;
    form.reset(defaultPointRules);
  }, [form, pointRules]);

  const milestones = form.watch('reportMilestoneThresholds');
  const caps = form.watch('volunteerBonusCapByDifficulty');
  const capRows = useMemo(() => {
    const defaultLevels = ['1', '2', '3', '4'];
    const normalizedCaps = Object.fromEntries(
      Object.entries(caps ?? {}).map(([difficulty, cap]) => [difficulty, Number(cap ?? 0)]),
    );
    return defaultLevels.map((difficulty) => ({
      difficulty,
      cap: Number.isFinite(normalizedCaps[difficulty]) ? normalizedCaps[difficulty] : 0,
    }));
  }, [caps]);

  const onAddMilestone = () => {
    const value = Number(milestoneInput);
    if (!Number.isFinite(value)) return;
    const next = [...(milestones ?? []), value].sort((a, b) => a - b);
    form.setValue('reportMilestoneThresholds', next);
    setMilestoneInput('');
  };

  const onSubmit = form.handleSubmit((values) => {
    const sorted = [...values.reportMilestoneThresholds].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(values.reportMilestoneThresholds)) {
      form.setError('reportMilestoneThresholds', { message: t('Milestones must be ascending') });
      return;
    }
    setPending(values);
    setConfirmOpen(true);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        {t('Changes affect leaderboard in real-time')}
      </div>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="rounded-xl border p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold md:text-base">{t('Volunteer Green Points')}</h3>
            {!editingVolunteerCard ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEditingVolunteerCard(true)}
                aria-label={t('Edit volunteer green points')}
              >
                <TbPencil className="size-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset(defaultPointRules);
                    setMilestoneInput('');
                    setEditingVolunteerCard(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit">{t('Save')}</Button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Field>
              <FieldLabel>{t('Base report point')}</FieldLabel>
              <Input
                type="number"
                disabled={!editingVolunteerCard}
                {...form.register('baseReportPoint', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3 disabled:cursor-not-allowed disabled:bg-zinc-100"
              />
            </Field>
            <Field>
              <FieldLabel>{t('Report milestone thresholds')}</FieldLabel>
              {editingVolunteerCard && (
                <div className="flex gap-2">
                  <Input
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    placeholder={t('Add milestone')}
                    type="number"
                    className="!h-10 !border !border-zinc-300 pl-3"
                  />
                  <Button type="button" variant="outline" onClick={onAddMilestone}>
                    {t('Add')}
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(milestones ?? []).map((item) => (
                  <div
                    key={item}
                    className={`inline-flex items-center rounded-full border ${
                      editingVolunteerCard ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'
                    }`}
                  >
                    {item}
                    {editingVolunteerCard && (
                      <button
                        type="button"
                        className="ml-2 rounded-full cursor-pointer p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600"
                        aria-label={t('Remove threshold {{value}}', { value: item })}
                        onClick={() =>
                          form.setValue(
                            'reportMilestoneThresholds',
                            (milestones ?? []).filter((value) => value !== item),
                          )
                        }
                      >
                        <TbX className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <FieldError errors={[form.formState.errors.reportMilestoneThresholds]} />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold md:text-base">{t('Citizen Green Points')}</h3>
            {!editingCitizenCard ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEditingCitizenCard(true)}
                aria-label={t('Edit citizen green points')}
              >
                <TbPencil className="size-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue(
                      'volunteerBonusCapByDifficulty',
                      defaultPointRules.volunteerBonusCapByDifficulty ?? {},
                    );
                    setEditingCitizenCard(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit">{t('Save')}</Button>
              </div>
            )}
          </div>
          <Field>
            <FieldLabel>{t('Volunteer bonus cap by difficulty')}</FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              {capRows.map((row) => (
                <div
                  key={row.difficulty}
                  className="grid grid-cols-1 items-center gap-2 rounded-md border p-3 md:grid-cols-[200px,1fr]"
                >
                  <span className="text-sm font-medium">
                    {t('Difficulty level {{level}}', { level: row.difficulty })}
                  </span>
                  <Input
                    type="number"
                    value={Number(form.watch(`volunteerBonusCapByDifficulty.${row.difficulty}`) ?? 0)}
                    disabled={!editingCitizenCard}
                    onChange={(e) =>
                      form.setValue(
                        `volunteerBonusCapByDifficulty.${row.difficulty}`,
                        Number(e.target.value),
                      )
                    }
                    className="!h-10 !border !border-zinc-300 pl-3 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  />
                </div>
              ))}
            </div>
            <FieldDescription>
              {t('Configure bonus cap for each difficulty level (level key from backend).')}
            </FieldDescription>
          </Field>
        </div>
      </form>
      <ConfirmApplyDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!pending) return;
          setConfirmOpen(false);
          setEditingVolunteerCard(false);
          setEditingCitizenCard(false);
          void savePointRules(pending);
        }}
      />
    </div>
  );
}
