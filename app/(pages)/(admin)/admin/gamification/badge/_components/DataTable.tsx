'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { IAdminBadgeDefinition } from '@/apis/gamification/badges/models';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import ChangeStatus from '@/components/ui/ChangeStatus';
import { BADGE_CATEGORY_LABEL, BADGE_SCOPE_LABEL, type BadgeCategory, type BadgeScope } from '@/constants/badge';
import { STATUS } from '@/constants/status';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import { TbPencil } from 'react-icons/tb';

import { useBadgeAdminContext } from '../_hooks/useBadgeAdminContext';
import { isImageSymbol } from './symbol';

const COLUMN_KEYS = {
  NO: 'no',
  SLUG: 'slug',
  NAME: 'name',
  SYMBOL: 'symbol',
  CATEGORY: 'category',
  SCOPE: 'scope',
  REPEAT: 'repeat',
  RULES: 'rules',
  REWARD: 'reward',
  ACTIVE: 'active',
  TIMESTAMPS: 'timestamps',
  ACTION: 'action',
} as const;

function rewardPreview(
  reward: Record<string, unknown> | null | undefined,
  t: (key: string) => string,
): string {
  if (reward == null) return '—';
  const chunks: string[] = [];
  const discountRaw = reward.discount_bps ?? reward.discountBps;
  if (typeof discountRaw === 'number' && Number.isFinite(discountRaw)) {
    chunks.push(`${t('Discount (bps)')}: ${discountRaw}`);
  }
  const bonusSpRaw = reward.bonus_sp;
  if (typeof bonusSpRaw === 'number' && Number.isFinite(bonusSpRaw)) {
    chunks.push(`${t('Bonus Points (SP)')}: ${bonusSpRaw}`);
  }
  const partnerTierCodesRaw = reward.partner_tier_codes;
  if (Array.isArray(partnerTierCodesRaw)) {
    const codes = partnerTierCodesRaw
      .filter((code): code is string => typeof code === 'string')
      .map((code) => code.trim())
      .filter(Boolean);
    if (codes.length > 0) {
      chunks.push(`${t('Partner tier codes')}: ${codes.join(', ')}`);
    }
  }
  if (chunks.length > 0) return chunks.join(' | ');
  try {
    const s = JSON.stringify(reward);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  } catch {
    return '—';
  }
}

function rulesPreview(rules: Record<string, unknown> | null | undefined): string {
  if (rules == null) return '—';
  try {
    const s = JSON.stringify(rules);
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  } catch {
    return '—';
  }
}

function repeatSummary(row: IAdminBadgeDefinition, t: (key: string) => string): string {
  const parts: string[] = [];
  parts.push(row.isRepeatable ? t('Repeatable') : t('Once'));
  if (row.maxGrantsPerUser != null) {
    parts.push(`${t('Max')}: ${row.maxGrantsPerUser}`);
  }
  if (row.cooldownSeconds > 0) {
    parts.push(`${t('Cooldown')}: ${row.cooldownSeconds}s`);
  }
  return parts.join(' · ');
}

export function DataTable({ onEdit }: { onEdit: (badge: IAdminBadgeDefinition) => void }) {
  const { t } = useTranslation();
  const {
    badges,
    loading,
    total,
    pagination,
    errorMessage,
    onRetry,
    onPageChange,
    onPageSizeChange,
  } = useBadgeAdminContext();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const columns: DataTableColumn<IAdminBadgeDefinition>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t('No'),
        className: 'w-[64px]',
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.NAME,
        title: t('Badge'),
        className: 'min-w-[160px]',
        render: (_, row) => (
          <div className="flex items-center gap-2 justify-start flex-row">
            {row.symbol?.trim() ? (
              isImageSymbol(row.symbol) ? (
                <img
                  src={row.symbol}
                  alt={t('Badge symbol')}
                  className="h-8 w-8 rounded-full object-cover border border-zinc-300"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg leading-none">
                  {row.symbol}
                </div>
              )
            ) : (
              '—'
            )}
            <div className="flex items-start gap-1 justify-start flex-col">
              <span className={cn(isDark ? 'text-zinc-200' : 'text-zinc-800')}>{row.name}</span>
              <span className="text-xs text-zinc-500">#{row.slug}</span>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.CATEGORY,
        title: t('Category'),
        className: 'w-[140px]',
        render: (_, row) => (
          <span>{BADGE_CATEGORY_LABEL[row.category as BadgeCategory] ?? row.category}</span>
        ),
      },
      {
        key: COLUMN_KEYS.SCOPE,
        title: t('Scope'),
        className: 'w-[100px]',
        render: (_, row) => (
          <span>{BADGE_SCOPE_LABEL[row.scope as BadgeScope] ?? row.scope}</span>
        ),
      },
      {
        key: COLUMN_KEYS.REPEAT,
        title: t('Repeat'),
        className: 'min-w-[140px]',
        render: (_, row) => (
          <span className="text-sm">{repeatSummary(row, t)}</span>
        ),
      },
      {
        key: COLUMN_KEYS.RULES,
        title: t('Rules'),
        className: 'min-w-[180px] max-w-[240px]',
        render: (_, row) => (
          <code
            className={cn(
              'block truncate text-xs',
              isDark ? 'text-zinc-400' : 'text-muted-foreground',
            )}
            title={rulesPreview(row.rulesConfig ?? undefined)}
          >
            {rulesPreview(row.rulesConfig ?? undefined)}
          </code>
        ),
      },
      {
        key: COLUMN_KEYS.REWARD,
        title: t('Reward'),
        className: 'min-w-[200px] max-w-[280px]',
        render: (_, row) => (
          <code
            className={cn(
              'block truncate text-xs',
              isDark ? 'text-zinc-400' : 'text-muted-foreground',
            )}
            title={rewardPreview(row.reward ?? undefined, t)}
          >
            {rewardPreview(row.reward ?? undefined, t)}
          </code>
        ),
      },
      {
        key: COLUMN_KEYS.ACTIVE,
        title: t('Status'),
        className: 'w-[100px]',
        render: (_, row) => (
          <div className="w-fit">
            <ChangeStatus
              type={row.isActive ? STATUS.ACTIVE : STATUS.INACTIVE}
              enabledDropdown={false}
            />
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.TIMESTAMPS,
        title: t('Timestamps'),
        className: 'min-w-[112px] whitespace-nowrap',
        render: (_, row) => (
          <div className="flex items-center gap-2 justify-start flex-col">
            <div>
              <span className="text-xs text-zinc-500">{t('Created')}:</span>{' '}
              {formattedDate(row.createdAt, true)}
            </div>
            <div>
              <span className="text-xs text-zinc-500">{t('Updated')}:</span>{' '}
              {formattedDate(row.updatedAt, true)}
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t('Action'),
        className: 'w-[100px]',
        render: (_, row) => (
          <button
            type="button"
            className={cn(
              'cursor-pointer rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200',
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
            )}
            onClick={() => onEdit(row)}
          >
            <TbPencil className="size-5" />
          </button>
        ),
      },
    ],
    [isDark, onEdit, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={badges}
      loading={loading}
      error={errorMessage}
      onRetry={onRetry}
      rowKey="id"
      emptyTitle={t('No badges found')}
      emptyDescription={t('No badges match the current filters.')}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
