'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYOUT_METRIC_OPTIONS } from '@/constants/gamification';
import { useTranslation } from 'react-i18next';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { PayoutTierItem } from '../_services/config.service';
import { ConfirmApplyDialog } from './ConfirmApplyDialog';
import { DataTable } from './DataTable';
import { HiPlusCircle } from 'react-icons/hi2';

export function LeaderboardPayoutTab() {
  const { t } = useTranslation();
  const { payoutTiers, savePayoutTier, deletePayoutTierById, loading } = useConfigContext();
  const [editing, setEditing] = useState<PayoutTierItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const form = useForm<PayoutTierItem>({
    values: editing ?? { id: '', metric: 'CRP', rankMin: 1, rankMax: 1, spAmount: 0 },
  });
  const createForm = useForm<Omit<PayoutTierItem, 'id'>>({
    defaultValues: { metric: 'CRP', rankMin: 1, rankMax: 1, spAmount: 0 },
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
        <Button
          type="button"
          onClick={() => setCreating(true)}
          className="!h-[45px] cursor-pointer px-4"
        >
          <div className="flex items-center gap-2">
            <HiPlusCircle className="size-5" />
            {t('Create tier')}
          </div>
        </Button>
      </div>
      <DataTable
        tab="payout-tiers"
        data={payoutTiers}
        loading={loading}
        onEdit={(row) => setEditing(row as PayoutTierItem)}
        onDelete={(row) => {
          setDeleteTargetId(String((row as PayoutTierItem).id));
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
              <FieldLabel>{t('Metric')}</FieldLabel>
              <Select
                value={form.watch('metric')}
                onValueChange={(value) => form.setValue('metric', value as PayoutTierItem['metric'])}
              >
                <SelectTrigger className="!h-10 !border !border-zinc-300">
                  <SelectValue placeholder={t('Select metric')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
              <FieldLabel>{t('Metric')}</FieldLabel>
              <Select
                value={createForm.watch('metric')}
                onValueChange={(value) =>
                  createForm.setValue('metric', value as Omit<PayoutTierItem, 'id'>['metric'])
                }
              >
                <SelectTrigger className="!h-10 !border !border-zinc-300">
                  <SelectValue placeholder={t('Select metric')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
      <ConfirmApplyDialog
        open={Boolean(deleteTargetId)}
        title={t('Delete payout tier?')}
        description={t('This action cannot be undone.')}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (!deleteTargetId) return;
          const targetId = deleteTargetId;
          setDeleteTargetId(null);
          void deletePayoutTierById(targetId);
        }}
      />
    </div>
  );
}
