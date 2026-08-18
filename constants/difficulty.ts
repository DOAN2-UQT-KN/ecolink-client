export const DIFFICULTY_LEVEL = {
  1: {
    label: 'Easy',
    color: 'emerald',
    textClass: 'text-emerald-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500',
  },
  2: {
    label: 'Medium',
    color: 'amber',
    textClass: 'text-amber-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500',
  },
  3: {
    label: 'Hard',
    color: 'orange',
    textClass: 'text-orange-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-orange-500 [&_[data-slot=slider-thumb]]:border-orange-500',
  },
  4: {
    label: 'Very Hard',
    color: 'rose',
    textClass: 'text-rose-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-rose-500 [&_[data-slot=slider-thumb]]:border-rose-500',
  },
} as const;

export type DifficultyLevelValue = keyof typeof DIFFICULTY_LEVEL;

export const DIFFICULTY_MIN = 1 as const;
export const DIFFICULTY_MAX = 4 as const;
export const DIFFICULTY_VALUES = [1, 2, 3, 4] as const;

export function isDifficultyLevel(value: number): value is DifficultyLevelValue {
  return value in DIFFICULTY_LEVEL;
}

export function getDifficultyLevel(value?: number | string | null) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric == null || Number.isNaN(numeric) || !isDifficultyLevel(numeric)) {
    return undefined;
  }
  return DIFFICULTY_LEVEL[numeric];
}

export function getDifficultyLabel(value?: number | string | null) {
  return getDifficultyLevel(value)?.label;
}

export function clampDifficulty(value?: number | null): DifficultyLevelValue {
  if (value == null || Number.isNaN(value)) {
    return DIFFICULTY_MIN;
  }
  const rounded = Math.round(value);
  if (rounded < DIFFICULTY_MIN) return DIFFICULTY_MIN;
  if (rounded > DIFFICULTY_MAX) return DIFFICULTY_MAX;
  return rounded as DifficultyLevelValue;
}
