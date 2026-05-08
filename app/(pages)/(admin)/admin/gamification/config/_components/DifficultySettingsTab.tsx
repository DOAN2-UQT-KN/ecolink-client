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
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { DifficultyItem } from '../_services/config.service';
import { DataTable } from './DataTable';

export function DifficultySettingsTab() {
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
