'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/libs/utils';

const DEFAULT_ICONS = [
  '🌱',
  '🌿',
  '🌳',
  '🌍',
  '♻️',
  '🌊',
  '☀️',
  '⭐',
  '🔥',
  '🙌',
  '💪',
  '🧹',
  '🚮',
  '🛠️',
  '🤝',
  '📍',
  '📸',
  '📝',
  '🔍',
  '📢',
  '💎',
  '🌟',
  '🧠',
  '⚡',
  '🚀',
] as const;

export type IconGridProps = {
  value?: string;
  onChange: (icon: string) => void;
  /** When true, disables picking and custom add (e.g. form submitting). */
  disabled?: boolean;
};

export function IconGrid({ value, onChange, disabled = false }: IconGridProps) {
  const { t } = useTranslation();
  const [extraIcons, setExtraIcons] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    const v = value?.trim();
    if (!v) return;
    const inDefaults = (DEFAULT_ICONS as readonly string[]).includes(v);
    setExtraIcons((prev) => {
      if (inDefaults || prev.includes(v)) return prev;
      return [...prev, v];
    });
  }, [value]);

  const gridIcons = useMemo(() => {
    const seen = new Set<string>([...DEFAULT_ICONS]);
    const ordered: string[] = [...DEFAULT_ICONS];
    for (const icon of extraIcons) {
      if (!seen.has(icon)) {
        seen.add(icon);
        ordered.push(icon);
      }
    }
    return ordered;
  }, [extraIcons]);

  const trimmedCustom = customInput.trim();
  const canAdd = trimmedCustom.length > 0;

  const handleAddCustom = () => {
    if (disabled || !canAdd) return;
    const icon = trimmedCustom;
    const alreadyInGrid =
      (DEFAULT_ICONS as readonly string[]).includes(icon) || extraIcons.includes(icon);
    if (!alreadyInGrid) {
      setExtraIcons((prev) => [...prev, icon]);
    }
    onChange(icon);
    setCustomInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid grid-cols-6 gap-2 sm:grid-cols-7 md:grid-cols-8"
        role="listbox"
        aria-label={t('Badge icon picker')}
      >
        {gridIcons.map((icon) => {
          const selected = value === icon;
          return (
            <button
              key={icon}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onChange(icon)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg border-2 text-2xl transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:border-primary/60 hover:bg-primary/5',
                selected
                  ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary/20'
                  : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/50',
              )}
            >
              <span className="leading-none select-none">{icon}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <Field className="min-w-0 flex-1">
          <FieldLabel className="sr-only">{t('Custom icon')}</FieldLabel>
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            placeholder={t('Add your own icon (emoji)')}
            className="h-10 !border !border-zinc-300"
            disabled={disabled}
          />
        </Field>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 px-4"
          disabled={disabled || !canAdd}
          onClick={handleAddCustom}
        >
          {t('Add Icon')}
        </Button>
      </div>
    </div>
  );
}
