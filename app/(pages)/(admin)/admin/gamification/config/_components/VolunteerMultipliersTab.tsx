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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useConfigContext } from '../_hooks/useConfigContext';
import type { MultiplierItem } from '../_services/config.service';
import { DataTable } from './DataTable';

export function VolunteerMultipliersTab() {
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
