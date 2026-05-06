'use client';

import { memo, useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import type { IAdminBadgeDefinition } from '@/apis/gamification/badges/models';
import { useCreateAdminBadge, usePatchAdminBadge } from '@/apis/gamification/badges/list';
import {
  BADGE_CATEGORY_KEYS,
  BADGE_CATEGORY_LABEL,
  BADGE_SCOPE_KEYS,
  BADGE_SCOPE_LABEL,
  type BadgeCategory,
  type BadgeScope,
} from '@/constants/badge';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/libs/utils';
import {
  buildRewardPayload,
  defaultValuesFromBadge,
  parseCooldownSecondsField,
  parseMaxGrantsPerUserField,
  parseOptionalNonNegativeInt,
  SYMBOL_IMAGE_ACCEPT,
  SYMBOL_IMAGE_MAX_SIZE_BYTES,
  type BadgeFormValues,
} from '../_services/badgeForm.service';
import { ruleTreeToApiPayload } from '../_services/badgeRulesAst';

import { BadgeRulesBuilder } from './BadgeRulesBuilder';
import { IconGrid } from './IconGrid';
import { isImageSymbol } from './symbol';

export interface CreateUpdateBadgeProps {
  open: boolean;
  onClose: () => void;
  badge?: IAdminBadgeDefinition | null;
  onSuccess: () => void;
}

type SymbolMode = 'emoji' | 'image';

function isValidBadgeCategory(value: string): value is BadgeCategory {
  return value in BADGE_CATEGORY_LABEL;
}

function isValidBadgeScope(value: string): value is BadgeScope {
  return value in BADGE_SCOPE_LABEL;
}

export const CreateUpdateBadge = memo(function CreateUpdateBadge({
  open,
  onClose,
  badge,
  onSuccess,
}: CreateUpdateBadgeProps) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const isCreate = !badge;
  const [symbolMode, setSymbolMode] = useState<SymbolMode>('emoji');

  const form = useForm<BadgeFormValues>({
    defaultValues: defaultValuesFromBadge(badge),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = form;

  const symbolValue = form.watch('symbol');

  useEffect(() => {
    if (!open) return;
    reset(defaultValuesFromBadge(badge));
    setSymbolMode(isImageSymbol(badge?.symbol) ? 'image' : 'emoji');
  }, [open, badge, reset]);

  const { mutateAsync: createMutate, isPending: isCreating } = useCreateAdminBadge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const { mutateAsync: patchMutate, isPending: isPatching } = usePatchAdminBadge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const busy = isCreating || isPatching || form.formState.isSubmitting;

  const handleSymbolModeChange = useCallback(
    (nextMode: SymbolMode) => {
      if (symbolMode === nextMode) return;
      setSymbolMode(nextMode);
      setValue('symbol', '', { shouldDirty: true, shouldValidate: true });
    },
    [setValue, symbolMode],
  );

  const handleSymbolFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setError('symbol', { message: t('Only png, jpg, jpeg, webp are allowed') });
        e.currentTarget.value = '';
        return;
      }
      if (file.size > SYMBOL_IMAGE_MAX_SIZE_BYTES) {
        setError('symbol', { message: t('Image size must be <= 2MB') });
        e.currentTarget.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result.startsWith('data:image')) {
          setError('symbol', { message: t('Invalid image data') });
          return;
        }
        form.clearErrors('symbol');
        setValue('symbol', result, { shouldDirty: true, shouldValidate: true });
      };
      reader.onerror = () => {
        setError('symbol', { message: t('Failed to read image file') });
      };
      reader.readAsDataURL(file);
    },
    [form, setError, setValue, t],
  );

  const onValidSubmit = useCallback(
    async (data: BadgeFormValues) => {
      clearErrors([
        'symbol',
        'category',
        'scope',
        'rulesConfig',
        'discountBps',
        'bonusSp',
        'cooldownSeconds',
        'maxGrantsPerUser',
      ]);

      if (!data.symbol.trim()) {
        setError('symbol', { message: t('Symbol is required') });
        return;
      }
      if (symbolMode === 'image' && !isImageSymbol(data.symbol)) {
        setError('symbol', { message: t('Please upload an image symbol') });
        return;
      }

      let resolvedSymbol = data.symbol.trim();
      if (symbolMode === 'image') {
        try {
          resolvedSymbol = await uploadToCloudinary(resolvedSymbol);
        } catch {
          setError('symbol', { message: t('Failed to upload image') });
          return;
        }
      }

      const rewardParsed = buildRewardPayload(data.discountBps, data.bonusSp);
      if (!rewardParsed.ok) {
        if (parseOptionalNonNegativeInt(data.discountBps) === 'invalid') {
          setError('discountBps', { message: t('Reward value must be >= 0') });
        }
        if (parseOptionalNonNegativeInt(data.bonusSp) === 'invalid') {
          setError('bonusSp', { message: t('Reward value must be >= 0') });
        }
        return;
      }

      if (!isValidBadgeCategory(data.category)) {
        setError('category', { message: t('Category is required') });
        return;
      }
      if (!isValidBadgeScope(data.scope)) {
        setError('scope', { message: t('Scope is required') });
        return;
      }

      const cooldownParsed = parseCooldownSecondsField(data.cooldownSeconds);
      if (cooldownParsed === 'invalid') {
        setError('cooldownSeconds', {
          message: t('Cooldown must be a non‑negative whole number of seconds'),
        });
        return;
      }

      const maxGrantsParsed = parseMaxGrantsPerUserField(data.maxGrantsPerUser);
      if (maxGrantsParsed === 'invalid') {
        setError('maxGrantsPerUser', {
          message: t('Max grants must be empty or a positive whole number'),
        });
        return;
      }

      try {
        if (isCreate) {
          await createMutate({
            name: data.name.trim(),
            category: data.category,
            scope: data.scope,
            isRepeatable: data.isRepeatable,
            cooldownSeconds: cooldownParsed,
            maxGrantsPerUser: maxGrantsParsed,
            rulesConfig: ruleTreeToApiPayload(data.rulesConfig) ?? undefined,
            isActive: true,
            symbol: resolvedSymbol || null,
            reward: rewardParsed.value,
            ...(data.publishNow ? { publishedAt: new Date().toISOString() } : {}),
          });
          return;
        }
        if (!badge) return;
        await patchMutate({
          id: badge.id,
          body: {
            name: data.name.trim(),
            category: data.category,
            scope: data.scope,
            isRepeatable: data.isRepeatable,
            cooldownSeconds: cooldownParsed,
            maxGrantsPerUser: maxGrantsParsed,
            rulesConfig: ruleTreeToApiPayload(data.rulesConfig),
            symbol: resolvedSymbol || null,
            reward: rewardParsed.value,
            isActive: data.isActive,
          },
        });
      } catch {
        /* surfaced by usePost */
      }
    },
    [badge, clearErrors, createMutate, isCreate, patchMutate, setError, symbolMode, t],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className={cn(
          'max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-4xl scrollbar-hide',
          isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900',
        )}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="!h-[20px]">
          <DialogTitle
            className={cn('text-left font-semibold ', isDark ? 'text-zinc-100' : 'text-zinc-900')}
          >
            {isCreate ? t('Create badge') : t('Edit badge')}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-6 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(onValidSubmit)(e);
          }}
        >
          <div className="flex flex-col gap-4">
            {!isCreate && badge ? (
              <Field>
                <FieldLabel>{t('Slug')}</FieldLabel>
                <Input value={badge.slug} className="h-10 !border !border-zinc-300" disabled />
              </Field>
            ) : null}

            <Field>
              <FieldLabel>
                {t('Name')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...register('name', {
                  required: t('Name is required'),
                  validate: (v) => v.trim().length > 0 || t('Name is required'),
                })}
                placeholder={t('Badge display name')}
                className="h-10 !border !border-zinc-300"
                disabled={busy}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel>{t('Symbol')}</FieldLabel>
              <div className="mb-3 inline-flex rounded-md border border-zinc-300 p-1 gap-1">
                <Button
                  type="button"
                  variant={symbolMode === 'emoji' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3"
                  disabled={busy}
                  onClick={() => handleSymbolModeChange('emoji')}
                >
                  {t('Emoji')}
                </Button>
                <Button
                  type="button"
                  variant={symbolMode === 'image' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3"
                  disabled={busy}
                  onClick={() => handleSymbolModeChange('image')}
                >
                  {t('Image')}
                </Button>
              </div>
              {symbolMode === 'emoji' ? (
                <Controller
                  control={control}
                  name="symbol"
                  render={({ field }) => (
                    <IconGrid value={field.value} onChange={field.onChange} disabled={busy} />
                  )}
                />
              ) : (
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept={SYMBOL_IMAGE_ACCEPT}
                    className="h-10 !border !border-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm"
                    disabled={busy}
                    onChange={handleSymbolFileChange}
                  />
                  {isImageSymbol(symbolValue) ? (
                    <img
                      src={symbolValue}
                      alt={t('Symbol preview')}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-300"
                    />
                  ) : null}
                </div>
              )}
              <FieldError errors={[errors.symbol]} />
            </Field>

            <Field>
              <FieldLabel>
                {t('Category')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="category"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as BadgeCategory)}
                    disabled={busy}
                  >
                    <SelectTrigger className="!h-10 !border !border-zinc-300">
                      <SelectValue placeholder={t('Category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_CATEGORY_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {BADGE_CATEGORY_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>

            <Field>
              <FieldLabel>
                {t('Scope')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="scope"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as BadgeScope)}
                    disabled={busy}
                  >
                    <SelectTrigger className="!h-10 !border !border-zinc-300">
                      <SelectValue placeholder={t('Scope')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_SCOPE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {BADGE_SCOPE_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.scope]} />
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  'Season badges evaluate metrics within the active season window; lifetime badges use all‑time data.',
                )}
              </p>
            </Field>

            <Field>
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <Controller
                  control={control}
                  name="isRepeatable"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                      disabled={busy}
                    />
                  )}
                />
                <span className="text-sm">{t('Repeatable badge (multiple grants per user)')}</span>
              </label>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t('Cooldown (seconds)')}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  {...register('cooldownSeconds')}
                  placeholder="0"
                  className="h-10 !border !border-zinc-300"
                  disabled={busy}
                />
                <FieldError errors={[errors.cooldownSeconds]} />
              </Field>
              <Field>
                <FieldLabel>{t('Max grants per user')}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  {...register('maxGrantsPerUser')}
                  placeholder={t('Empty = no cap')}
                  className="h-10 !border !border-zinc-300"
                  disabled={busy}
                />
                <FieldError errors={[errors.maxGrantsPerUser]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>{t('Badge rules')}</FieldLabel>
              <Controller
                control={control}
                name="rulesConfig"
                render={({ field }) => (
                  <BadgeRulesBuilder
                    value={field.value}
                    onChange={field.onChange}
                    disabled={busy}
                    isDark={isDark}
                  />
                )}
              />
              <FieldError errors={[errors.rulesConfig]} />
            </Field>

            <Field>
              <FieldLabel>{t('Reward')}</FieldLabel>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1 italic">{t('Discount (bps)')}</div>
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    {...register('discountBps')}
                    placeholder={t('Discount (bps)')}
                    className="h-10 !border !border-zinc-300"
                    disabled={busy}
                  />
                  <FieldError errors={[errors.discountBps]} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1 italic">{t('Bonus Points (SP)')}</div>
                  <Input
                    type="number"
                    min={0}
                    {...register('bonusSp')}
                    placeholder={t('Bonus Points (SP)')}
                    className="h-10 !border !border-zinc-300"
                    disabled={busy}
                  />
                  <FieldError errors={[errors.bonusSp]} />
                </div>
              </div>
            </Field>

            {!isCreate ? (
              <Field>
                <FieldLabel>{t('Status')}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Select
                      value={field.value ? 'active' : 'inactive'}
                      onValueChange={(value) => field.onChange(value === 'active')}
                      disabled={busy}
                    >
                      <SelectTrigger className="!h-10 !border !border-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('Active')}</SelectItem>
                        <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.isActive]} />
              </Field>
            ) : null}

            {isCreate ? (
              <Field>
                <label className="flex cursor-pointer items-center gap-2 pt-1">
                  <Controller
                    control={control}
                    name="publishNow"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(c === true)}
                        disabled={busy}
                      />
                    )}
                  />
                  <span className="text-sm">{t('Publish immediately (locks slug)')}</span>
                </label>
              </Field>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={busy}
              className="px-4 !h-[45px] cursor-pointer"
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={busy} className="px-4 !h-[45px] cursor-pointer">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default CreateUpdateBadge;
