import type { IGetPointTransactionRequest } from '@/apis/points/models/getPointTransaction';
import type { IPointTransaction } from '@/apis/points/models/point';

export type PointsFilterTab = 'all' | 'earned' | 'spent';

type PointTransactionRequestWithType = IGetPointTransactionRequest & {
  type?: 'earned' | 'spent';
};

export const POINTS_DEFAULT_PAGE_SIZE = 10;

export const POINTS_FILTER_TABS: PointsFilterTab[] = ['all', 'earned', 'spent'];

export function buildTransactionRequestByTab(tab: PointsFilterTab): PointTransactionRequestWithType {
  if (tab === 'all') return {};

  return { type: tab };
}

export function normalizeTransactions(transactions?: IPointTransaction[]): IPointTransaction[] {
  if (!Array.isArray(transactions)) return [];
  return transactions;
}

export function formatPoints(value?: number): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

export function formatTransactionDate(value?: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function inferTransactionKind(type?: string, points?: number): 'earned' | 'spent' {
  const normalizedType = (type ?? '').trim().toLowerCase();

  if (normalizedType.includes('spend') || normalizedType.includes('redeem')) return 'spent';
  if (normalizedType.includes('earn') || normalizedType.includes('reward')) return 'earned';

  return (points ?? 0) < 0 ? 'spent' : 'earned';
}
