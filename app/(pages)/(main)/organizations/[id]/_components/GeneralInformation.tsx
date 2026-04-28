'use client';

import React, { memo, useMemo } from 'react';
import { TbAlignLeft2, TbCalendarCheck, TbMailPin } from 'react-icons/tb';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { useOrganizationDetail } from '../_hooks/useOrganizationDetail';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { cn } from '@/libs/utils';

function formatCreatedAt(iso: string | undefined): string {
  if (!iso?.trim()) return '—';
  try {
    return format(parseISO(iso), 'PPP');
  } catch {
    return iso;
  }
}

export const GeneralInformation = memo(function GeneralInformation() {
  const { t } = useTranslation();
  const { organization } = useOrganizationDetail();

  const contactEmail = organization?.contact_email?.trim() ?? '';
  const description = organization?.description?.trim() ?? '';
  const isEmailVerified = Boolean(organization?.is_email_verified);
  const createdLabel = useMemo(
    () => formatCreatedAt(organization?.created_at),
    [organization?.created_at],
  );

  if (!organization) {
    return null;
  }

  return (
    <aside className="w-full rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/70 p-4 sm:p-5 space-y-5 shadow-sm">
      <div>
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t('Contact')}
        </p>
        <div className="mt-2 flex items-start gap-2 text-sm text-foreground min-w-0">
          <TbMailPin className="size-4 shrink-0 text-button-accent mt-0.5" aria-hidden />
          {contactEmail ? (
            <div className="min-w-0">
              <a
                href={`mailto:${contactEmail}`}
                className="break-all text-foreground-secondary hover:underline"
              >
                <span className="font-display-1">{contactEmail}</span>
              </a>
              <div className="mt-1">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                    isEmailVerified
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                >
                  {isEmailVerified ? t('Verified') : t('Unverified')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-foreground-secondary">—</span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 bg-white/50 flex-col">
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t('Description')}
        </p>
        <div className="flex items-start gap-2 text-sm text-foreground">
          <TbAlignLeft2 className="size-4 shrink-0 text-button-accent mt-1.5" />
          <div className="min-w-0">
            <RichTextContent
              value={description}
              className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
              maxLines={4}
              showMoreLabel={t('See more')}
              showLessLabel={t('See less')}
              emptyFallback={<span className="text-foreground-secondary">—</span>}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
          {t('Created at')}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
          <TbCalendarCheck className="size-4 shrink-0 text-button-accent" aria-hidden />
          <span className="font-display-1">{createdLabel}</span>
        </div>
      </div>
    </aside>
  );
});
