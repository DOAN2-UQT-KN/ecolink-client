'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { TbPencil } from 'react-icons/tb';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { SpRulesData } from '../_services/config.service';
import { ConfirmApplyDialog } from './ConfirmApplyDialog';

export function SpRulesTab() {
  const { t } = useTranslation();
  const { spRules, saveSpRules } = useConfigContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<SpRulesData | null>(null);
  const [editingSpCard, setEditingSpCard] = useState(false);
  const defaultSpRules: SpRulesData = spRules ?? { expirationDays: 0 };
  const form = useForm<SpRulesData>({
    defaultValues: defaultSpRules,
  });
  const lastSpRulesSnapshotRef = useRef<string>('');

  useEffect(() => {
    const snapshot = JSON.stringify(defaultSpRules);
    if (snapshot === lastSpRulesSnapshotRef.current) return;
    lastSpRulesSnapshotRef.current = snapshot;
    form.reset(defaultSpRules);
  }, [form, spRules]);

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
        <div className="rounded-xl border p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold md:text-bdase">{t('Spendable Point Rules')}</h3>
            {!editingSpCard ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEditingSpCard(true)}
                aria-label={t('Edit spendable point rules')}
              >
                <TbPencil className="size-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset(defaultSpRules);
                    setEditingSpCard(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit">{t('Save')}</Button>
              </div>
            )}
          </div>

          <Field>
            <FieldLabel>{t('Expiration days')}</FieldLabel>
            <Input
              type="number"
              disabled={!editingSpCard}
              {...form.register('expirationDays', { valueAsNumber: true, min: 1 })}
              className="!h-10 !border !border-zinc-300 pl-3 disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
            <FieldDescription>
              {t('Points expire after {{days}} days', { days: Number(expirationDays || 0) })}
            </FieldDescription>
            <FieldError errors={[form.formState.errors.expirationDays]} />
          </Field>
        </div>
      </form>
      <ConfirmApplyDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!pending) return;
          setConfirmOpen(false);
          setEditingSpCard(false);
          void saveSpRules(pending);
        }}
      />
    </div>
  );
}
