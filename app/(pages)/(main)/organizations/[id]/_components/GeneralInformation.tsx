'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { TbAlignLeft2, TbCalendarCheck, TbMailPin } from 'react-icons/tb';
import { format, parseISO } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useResendContactEmail } from '@/apis/organization/organizationById';
import { Button } from '@/components/client/shared/Button';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { cn } from '@/libs/utils';

import { useOrganizationDetail } from '../_hooks/useOrganizationDetail';

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
  const queryClient = useQueryClient();
  const { organization, organizationId, showYourGroupTag } = useOrganizationDetail();

  const contactEmail = organization?.contact_email?.trim() ?? '';
  const description = organization?.description?.trim() ?? '';
  const isEmailVerified = Boolean(organization?.is_email_verified);

  const { mutate: resendVerificationEmail, isPending: isResendPending } = useResendContactEmail({
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });
    },
  });

  const handleResendVerificationEmail = useCallback(() => {
    if (!organizationId) return;
    resendVerificationEmail(organizationId);
  }, [organizationId, resendVerificationEmail]);

  const showResendContactEmail = showYourGroupTag && Boolean(contactEmail) && !isEmailVerified;
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
              <div className="flex items-center gap-1">
                <a
                  href={`mailto:${contactEmail}`}
                  className="break-all text-foreground-secondary hover:underline"
                >
                  <span className="font-display-1">{contactEmail}</span>
                </a>
                <div className="mt-1">
                  <div
                    className={cn(
                      'inline-flex items-center flex-row rounded-[10px] border px-2 py-0.5 text-[11px] font-display-1',
                      isEmailVerified
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-800',
                    )}
                  >
                    {isEmailVerified ? t('Verified') : t('Unverified')}
                  </div>
                </div>
              </div>
              {showResendContactEmail ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outlined-brown"
                    size="small"
                    className="w-full max-w-[220px]"
                    isLoading={isResendPending}
                    isDisabled={!organizationId}
                    onClick={handleResendVerificationEmail}
                  >
                    {t('Resend verification email')}
                  </Button>
                </div>
              ) : null}
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
