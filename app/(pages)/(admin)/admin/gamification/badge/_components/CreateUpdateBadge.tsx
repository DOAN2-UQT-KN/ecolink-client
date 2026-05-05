'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import type { IAdminBadgeDefinition } from '@/apis/gamification/models/gamificationBadge';
import { useCreateAdminBadge, usePatchAdminBadge } from '@/apis/gamification/adminBadge';
import {
  BADGE_CATEGORY_KEYS,
  BADGE_CATEGORY_LABEL,
  BADGE_METRIC_LABEL,
  BADGE_METRICS_BY_CATEGORY,
  BADGE_RULE_TYPE_KEYS,
  BADGE_RULE_TYPE_LABEL,
  type BadgeCategory,
  type BadgeMetric,
  type BadgeRuleType,
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

import { IconGrid } from './IconGrid';
import { isImageSymbol } from './symbol';

export interface CreateUpdateBadgeProps {
  open: boolean;
  onClose: () => void;
  badge?: IAdminBadgeDefinition | null;
  onSuccess: () => void;
}

type ApiLeaderboardMetric = BadgeMetric;
type SymbolMode = 'emoji' | 'image';

type BadgeFormValues = {
  name: string;
  symbol: string;
  category: BadgeCategory;
  metric: BadgeMetric;
  ruleType: BadgeRuleType;
  threshold: string;
  rankTopN: string;
  discountBps: string;
  bonusSp: string;
  isActive: boolean;
  publishNow: boolean;
};

const SYMBOL_IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp';
const SYMBOL_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

function rewardFieldsFromBadge(
  reward: Record<string, unknown> | null | undefined,
): Pick<BadgeFormValues, 'discountBps' | 'bonusSp'> {
  if (!reward) return { discountBps: '', bonusSp: '' };
  const rawDiscount = reward.discount_bps ?? reward.discountBps;
  const discountBps =
    typeof rawDiscount === 'number' && Number.isFinite(rawDiscount) ? String(rawDiscount) : '';
  const rawBonusSp = reward.bonus_sp;
  const bonusSp =
    typeof rawBonusSp === 'number' && Number.isFinite(rawBonusSp) ? String(rawBonusSp) : '';
  return { discountBps, bonusSp };
}

function parseOptionalNonNegativeInt(raw: string): number | null | 'invalid' {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return 'invalid';
  return n;
}

function parseRankTopN(raw: string): number | null | 'invalid' {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 'invalid';
  return n;
}

function buildRewardPayload(
  discountBpsStr: string,
  bonusSpStr: string,
): { ok: true; value: Record<string, unknown> | null } | { ok: false } {
  const discountParsed = parseOptionalNonNegativeInt(discountBpsStr);
  const bonusSpParsed = parseOptionalNonNegativeInt(bonusSpStr);
  if (discountParsed === 'invalid' || bonusSpParsed === 'invalid') return { ok: false };
  if (discountParsed === null && bonusSpParsed === null) return { ok: true, value: null };
  const payload: Record<string, unknown> = {};
  if (discountParsed !== null) payload.discount_bps = discountParsed;
  if (bonusSpParsed !== null) payload.bonus_sp = bonusSpParsed;
  return { ok: true, value: payload };
}

function defaultValuesFromBadge(badge?: IAdminBadgeDefinition | null): BadgeFormValues {
  if (!badge) {
    return {
      name: '',
      symbol: '',
      category: 'CONTRIBUTION',
      metric: 'CRP',
      ruleType: 'THRESHOLD',
      threshold: '',
      rankTopN: '',
      discountBps: '',
      bonusSp: '',
      isActive: true,
      publishNow: false,
    };
  }
  const rf = rewardFieldsFromBadge(badge.reward ?? undefined);
  return {
    name: badge.name,
    symbol: badge.symbol ?? '',
    category: (badge.category in BADGE_CATEGORY_LABEL
      ? badge.category
      : badge.ruleType === 'RANK'
        ? 'RANK'
        : 'CONTRIBUTION') as BadgeCategory,
    metric: (badge.metric in BADGE_METRIC_LABEL ? badge.metric : 'CRP') as BadgeMetric,
    ruleType: (badge.ruleType in BADGE_RULE_TYPE_LABEL
      ? badge.ruleType
      : 'THRESHOLD') as BadgeRuleType,
    threshold: badge.threshold != null ? String(badge.threshold) : '',
    rankTopN: badge.rankTopN != null ? String(badge.rankTopN) : '',
    discountBps: rf.discountBps,
    bonusSp: rf.bonusSp,
    isActive: badge.isActive,
    publishNow: false,
  };
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

  const category = useWatch({ control, name: 'category' });
  const metric = useWatch({ control, name: 'metric' });
  const ruleType = useWatch({ control, name: 'ruleType' });
  const symbolValue = useWatch({ control, name: 'symbol' });

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

  const metricSelectItems = useMemo(
    () =>
      BADGE_METRICS_BY_CATEGORY[category ?? 'CONTRIBUTION'].map((key) => ({
        value: key,
        label: BADGE_METRIC_LABEL[key],
      })),
    [category],
  );

  const showThresholdInput = ruleType === 'THRESHOLD';
  const showRankTopNInput = ruleType === 'RANK';

  const onValidSubmit = useCallback(
    async (data: BadgeFormValues) => {
      clearErrors([
        'symbol',
        'category',
        'metric',
        'ruleType',
        'discountBps',
        'bonusSp',
        'threshold',
        'rankTopN',
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

      if (!(data.category in BADGE_CATEGORY_LABEL)) {
        setError('category', { message: t('Category is required') });
        return;
      }
      if (!(data.metric in BADGE_METRIC_LABEL)) {
        setError('metric', { message: t('Metric is required') });
        return;
      }
      if (!(data.ruleType in BADGE_RULE_TYPE_LABEL)) {
        setError('ruleType', { message: t('Rule type is required') });
        return;
      }

      const allowedMetrics = BADGE_METRICS_BY_CATEGORY[data.category];
      if (!allowedMetrics.includes(data.metric)) {
        setError('metric', { message: t('Metric does not match category') });
        return;
      }

      if (data.category === 'RANK' && data.ruleType !== 'RANK') {
        setError('ruleType', { message: t('Ranking category must use Top Ranking rule') });
        return;
      }

      let threshold: number | null = null;
      let rankTopN: number | null = null;

      if (data.ruleType === 'THRESHOLD') {
        const th = parseOptionalNonNegativeInt(data.threshold);
        if (th === 'invalid') {
          setError('threshold', { message: t('Invalid number') });
          return;
        }
        if (th === null) {
          setError('threshold', { message: t('Threshold is required') });
          return;
        }
        threshold = th;
        if (data.rankTopN.trim().length > 0) {
          setError('rankTopN', { message: t('Rank top N must be empty for threshold rule') });
          return;
        }
      } else {
        const rn = parseRankTopN(data.rankTopN);
        if (rn === 'invalid') {
          setError('rankTopN', { message: t('Invalid number') });
          return;
        }
        if (rn === null) {
          setError('rankTopN', { message: t('Rank top N is required') });
          return;
        }
        rankTopN = rn;
        if (data.threshold.trim().length > 0) {
          setError('threshold', { message: t('Threshold must be empty for Top Ranking rule') });
          return;
        }
      }

      try {
        if (isCreate) {
          await createMutate({
            name: data.name.trim(),
            category: data.category,
            ruleType: data.ruleType,
            metric: data.metric as ApiLeaderboardMetric,
            isActive: true,
            symbol: resolvedSymbol || null,
            threshold,
            rankTopN,
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
            ruleType: data.ruleType,
            metric: data.metric as ApiLeaderboardMetric,
            symbol: resolvedSymbol || null,
            threshold,
            rankTopN,
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
          'max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-xl',
          isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900',
        )}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle
            className={cn('text-left font-semibold', isDark ? 'text-zinc-100' : 'text-zinc-900')}
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
                  onClick={() => {
                    if (symbolMode === 'emoji') return;
                    setSymbolMode('emoji');
                    setValue('symbol', '', { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  {t('Emoji')}
                </Button>
                <Button
                  type="button"
                  variant={symbolMode === 'image' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3"
                  disabled={busy}
                  onClick={() => {
                    if (symbolMode === 'image') return;
                    setSymbolMode('image');
                    setValue('symbol', '', { shouldDirty: true, shouldValidate: true });
                  }}
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
                    onChange={(e) => {
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
                        clearErrors('symbol');
                        setValue('symbol', result, { shouldDirty: true, shouldValidate: true });
                      };
                      reader.onerror = () => {
                        setError('symbol', { message: t('Failed to read image file') });
                      };
                      reader.readAsDataURL(file);
                    }}
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
                    onValueChange={(value) => {
                      const nextCategory = value as BadgeCategory;
                      field.onChange(nextCategory);
                      const allowed = BADGE_METRICS_BY_CATEGORY[nextCategory];
                      if (!allowed.includes(metric)) {
                        setValue('metric', allowed[0], { shouldDirty: true, shouldValidate: true });
                      }
                      if (nextCategory === 'RANK') {
                        setValue('ruleType', 'RANK', { shouldDirty: true, shouldValidate: true });
                        setValue('threshold', '');
                      }
                    }}
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
                {t('Metric')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="metric"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v as BadgeMetric);
                      setValue('threshold', '');
                      setValue('rankTopN', '');
                    }}
                    disabled={busy}
                  >
                    <SelectTrigger className="!h-10 !border !border-zinc-300">
                      <SelectValue placeholder={t('Metric')} />
                    </SelectTrigger>
                    <SelectContent>
                      {metricSelectItems.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.metric]} />
            </Field>

            <Field>
              <FieldLabel>
                {t('Rule type')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="ruleType"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const nextRuleType = value as BadgeRuleType;
                      if (category === 'RANK' && nextRuleType !== 'RANK') {
                        return;
                      }
                      field.onChange(nextRuleType);
                      if (nextRuleType === 'THRESHOLD') {
                        setValue('rankTopN', '');
                      } else {
                        setValue('threshold', '');
                      }
                    }}
                    disabled={busy}
                  >
                    <SelectTrigger className="!h-10 !border !border-zinc-300">
                      <SelectValue placeholder={t('Rule type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_RULE_TYPE_KEYS.map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                          disabled={category === 'RANK' && key !== 'RANK'}
                        >
                          {BADGE_RULE_TYPE_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.ruleType]} />
            </Field>

            {showThresholdInput ? (
              <Field>
                <FieldLabel>{t('Threshold')}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  {...register('threshold')}
                  placeholder={t('Minimum points')}
                  className="h-10 !border !border-zinc-300"
                  disabled={busy}
                />
                <FieldError errors={[errors.threshold]} />
              </Field>
            ) : null}

            {showRankTopNInput ? (
              <Field>
                <FieldLabel>{t('Rank top N')}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  {...register('rankTopN')}
                  placeholder={t('Top N rank')}
                  className="h-10 !border !border-zinc-300"
                  disabled={busy}
                />
                <FieldError errors={[errors.rankTopN]} />
              </Field>
            ) : null}

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
