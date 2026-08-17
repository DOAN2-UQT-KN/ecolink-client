export const SEVERITY_LEVEL = {
  1: {
    label: 'Low',
    color: 'blue',
    textClass: 'text-blue-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-thumb]]:border-blue-500',
  },
  2: {
    label: 'Moderate',
    color: 'green',
    textClass: 'text-green-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-green-500 [&_[data-slot=slider-thumb]]:border-green-500',
  },
  3: {
    label: 'Substantial',
    color: 'yellow',
    textClass: 'text-yellow-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-yellow-500 [&_[data-slot=slider-thumb]]:border-yellow-500',
  },
  4: {
    label: 'Severe',
    color: 'orange',
    textClass: 'text-orange-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-orange-500 [&_[data-slot=slider-thumb]]:border-orange-500',
  },
  5: {
    label: 'Critical',
    color: 'red',
    textClass: 'text-red-600',
    sliderClass:
      '[&_[data-slot=slider-range]]:bg-red-500 [&_[data-slot=slider-thumb]]:border-red-500',
  },
} as const;

export type SeverityLevelValue = keyof typeof SEVERITY_LEVEL;

export const SEVERITY_MIN = 1 as const;
export const SEVERITY_MAX = 5 as const;

export function isSeverityLevel(value: number): value is SeverityLevelValue {
  return value in SEVERITY_LEVEL;
}

export function getSeverityLevel(value?: number | string | null) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric == null || Number.isNaN(numeric) || !isSeverityLevel(numeric)) {
    return undefined;
  }
  return SEVERITY_LEVEL[numeric];
}

export function getSeverityLabel(value?: number | string | null) {
  return getSeverityLevel(value)?.label;
}
