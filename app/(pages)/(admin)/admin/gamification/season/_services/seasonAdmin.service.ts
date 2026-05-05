"use client";

import type { ISeason } from "@/apis/gamification/season/models";

export type SeasonKind = "MONTHLY" | "QUARTERLY";

export type SeasonFilterValues = {
  search: string;
  kind: "" | SeasonKind;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function normalizeSeasonPageSize(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? limit
    : 10;
}

export function parseIsoToDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function toIsoStartOfDay(date?: Date): string | undefined {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)).toISOString();
}

export function toIsoEndOfDay(date?: Date): string | undefined {
  if (!date) return undefined;
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
  ).toISOString();
}

export function isActiveSeason(season: ISeason): boolean {
  return season.status === "ACTIVE";
}
