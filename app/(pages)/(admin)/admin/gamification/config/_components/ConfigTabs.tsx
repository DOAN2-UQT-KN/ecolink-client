'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { TbPencil, TbX } from 'react-icons/tb';
import { ConfirmApplyDialog } from './ConfirmApplyDialog';
import { DataTable } from './DataTable';
import { useConfigContext } from '../_hooks/useConfigContext';
import type {
  ConfigTabKey,
  DifficultyItem,
  MultiplierItem,
  PayoutTierItem,
  PointRulesData,
  SpRulesData,
} from '../_services/config.service';

function PointRulesTab() {
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
                    value={Number(
                      form.watch(`volunteerBonusCapByDifficulty.${row.difficulty}`) ?? 0,
                    )}
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

function SpRulesTab() {
  const { t } = useTranslation();
  const { spRules, saveSpRules } = useConfigContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<SpRulesData | null>(null);
  const form = useForm<SpRulesData>({
    values: spRules ?? { expirationDays: 0 },
  });
  const expirationDays = form.watch('expirationDays');

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          setPending(values);
          setConfirmOpen(true);
        })}
      >
        <Field>
          <FieldLabel>{t('Expiration days')}</FieldLabel>
          <Input
            type="number"
            {...form.register('expirationDays', { valueAsNumber: true, min: 1 })}
            className="!h-10 !border !border-zinc-300 pl-3"
          />
          <FieldDescription>
            {t('Points expire after {{days}} days', { days: Number(expirationDays || 0) })}
          </FieldDescription>
          <FieldError errors={[form.formState.errors.expirationDays]} />
        </Field>
        <Button type="submit">{t('Apply changes')}</Button>
      </form>
      <ConfirmApplyDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!pending) return;
          setConfirmOpen(false);
          void saveSpRules(pending);
        }}
      />
    </div>
  );
}

function VolunteerMultipliersTab() {
  const { t } = useTranslation();
  const { multipliers, saveMultiplier, loading } = useConfigContext();
  const [editing, setEditing] = useState<MultiplierItem | null>(null);
  const form = useForm<MultiplierItem>({
    values: editing ?? { code: '', description: '', multiplier: 0 },
  });

  return (
    <div className="space-y-4">
      <DataTable
        tab="multipliers"
        data={multipliers}
        loading={loading}
        onEdit={(row) => setEditing(row as MultiplierItem)}
      />
      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Edit multiplier')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              if (values.multiplier < 0) {
                form.setError('multiplier', { message: t('Multiplier must be >= 0') });
                return;
              }
              await saveMultiplier(values);
              setEditing(null);
            })}
          >
            <Field>
              <FieldLabel>{t('Code')}</FieldLabel>
              <Input {...form.register('code')} disabled />
            </Field>
            <Field>
              <FieldLabel>{t('Description')}</FieldLabel>
              <Input {...form.register('description')} disabled />
            </Field>
            <Field>
              <FieldLabel>{t('Multiplier')}</FieldLabel>
              <Input
                type="number"
                step="0.1"
                {...form.register('multiplier', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
              {Number(form.watch('multiplier') ?? 0) > 3 && (
                <FieldDescription className="text-amber-600">
                  {t('Warning: multiplier above 3 is unusually high.')}
                </FieldDescription>
              )}
              <FieldError errors={[form.formState.errors.multiplier]} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DifficultySettingsTab() {
  const { t } = useTranslation();
  const { difficulties, saveDifficulty, loading } = useConfigContext();
  const [editing, setEditing] = useState<DifficultyItem | null>(null);
  const form = useForm<DifficultyItem>({
    values: editing ?? { id: '', level: 1, name: '', greenPointsReward: 0 },
  });

  return (
    <div className="space-y-4">
      <DataTable
        tab="difficulty-settings"
        data={difficulties}
        loading={loading}
        onEdit={(row) => setEditing(row as DifficultyItem)}
      />
      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Edit difficulty setting')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await saveDifficulty(values);
              setEditing(null);
            })}
          >
            <Field>
              <FieldLabel>{t('Difficulty level')}</FieldLabel>
              <Input
                type="number"
                {...form.register('level', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <Field>
              <FieldLabel>{t('Name')}</FieldLabel>
              <Input
                {...form.register('name', { required: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <Field>
              <FieldLabel>{t('GreenPoints reward')}</FieldLabel>
              <Input
                type="number"
                {...form.register('greenPointsReward', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeaderboardPayoutTab() {
  const { t } = useTranslation();
  const { payoutTiers, savePayoutTier, deletePayoutTierById, loading } = useConfigContext();
  const [editing, setEditing] = useState<PayoutTierItem | null>(null);
  const [creating, setCreating] = useState(false);
  const form = useForm<PayoutTierItem>({
    values: editing ?? { id: '', rankMin: 1, rankMax: 1, spAmount: 0 },
  });
  const createForm = useForm<Omit<PayoutTierItem, 'id'>>({
    defaultValues: { rankMin: 1, rankMax: 1, spAmount: 0 },
  });

  const hasOverlap = (values: { rankMin: number; rankMax: number }, id?: string) => {
    return payoutTiers.some((tier) => {
      if (id && tier.id === id) return false;
      return values.rankMin <= tier.rankMax && values.rankMax >= tier.rankMin;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          {t('Create tier')}
        </Button>
      </div>
      <DataTable
        tab="payout-tiers"
        data={payoutTiers}
        loading={loading}
        onEdit={(row) => setEditing(row as PayoutTierItem)}
        onDelete={(row) => {
          void deletePayoutTierById(String((row as PayoutTierItem).id));
        }}
      />
      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Edit payout tier')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              if (hasOverlap(values, values.id)) {
                form.setError('rankMax', { message: t('Rank range overlaps existing tier') });
                return;
              }
              await savePayoutTier(values);
              setEditing(null);
            })}
          >
            <Field>
              <FieldLabel>{t('Rank min')}</FieldLabel>
              <Input
                type="number"
                {...form.register('rankMin', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <Field>
              <FieldLabel>{t('Rank max')}</FieldLabel>
              <Input
                type="number"
                {...form.register('rankMax', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
              <FieldError errors={[form.formState.errors.rankMax]} />
            </Field>
            <Field>
              <FieldLabel>{t('SP amount')}</FieldLabel>
              <Input
                type="number"
                {...form.register('spAmount', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={creating} onOpenChange={(next) => !next && setCreating(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Create payout tier')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit(async (values) => {
              if (hasOverlap(values)) {
                createForm.setError('rankMax', { message: t('Rank range overlaps existing tier') });
                return;
              }
              await savePayoutTier(values);
              setCreating(false);
            })}
          >
            <Field>
              <FieldLabel>{t('Rank min')}</FieldLabel>
              <Input
                type="number"
                {...createForm.register('rankMin', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <Field>
              <FieldLabel>{t('Rank max')}</FieldLabel>
              <Input
                type="number"
                {...createForm.register('rankMax', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
              <FieldError errors={[createForm.formState.errors.rankMax]} />
            </Field>
            <Field>
              <FieldLabel>{t('SP amount')}</FieldLabel>
              <Input
                type="number"
                {...createForm.register('spAmount', { valueAsNumber: true })}
                className="!h-10 !border !border-zinc-300 pl-3"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Create')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ConfigTabs() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, loading } = useConfigContext();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ConfigTabKey)}
      className="space-y-4"
    >
      <TabsList
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
        variant="line"
      >
        <TabsTrigger value="point-rules">{t('Point Rules')}</TabsTrigger>
        <TabsTrigger value="sp-rules">{t('Spendable Points (SP) Rules')}</TabsTrigger>
        <TabsTrigger value="multipliers">{t('Volunteer Multipliers')}</TabsTrigger>
        <TabsTrigger value="difficulty-settings">{t('Difficulty Settings')}</TabsTrigger>
        <TabsTrigger value="payout-tiers">{t('Leaderboard Payout Tiers')}</TabsTrigger>
      </TabsList>

      <div className="rounded-xl border bg-card p-4 md:p-6">
        {loading && (
          <p className="text-sm text-muted-foreground">{t('Loading configuration...')}</p>
        )}
        <TabsContent value="point-rules">
          <PointRulesTab />
        </TabsContent>
        <TabsContent value="sp-rules">
          <SpRulesTab />
        </TabsContent>
        <TabsContent value="multipliers">
          <VolunteerMultipliersTab />
        </TabsContent>
        <TabsContent value="difficulty-settings">
          <DifficultySettingsTab />
        </TabsContent>
        <TabsContent value="payout-tiers">
          <LeaderboardPayoutTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
