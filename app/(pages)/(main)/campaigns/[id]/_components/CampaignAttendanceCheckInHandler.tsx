'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { checkInCampaignAttendance } from '@/apis/campaign/campaignAttendance';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

export function CampaignAttendanceCheckInHandler() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { campaignId, campaign, isLoading, isError } = useCampaignDetail();
  const token = searchParams.get('attendance');
  const [modalOpen, setModalOpen] = useState(false);
  const [already, setAlready] = useState(false);
  const finished = useRef(false);

  const clearQuery = useCallback(() => {
    router.replace(`/campaigns/${campaignId}`);
  }, [router, campaignId]);

  useEffect(() => {
    const raw = token?.trim();
    if (!raw || isLoading || isError || !campaign || finished.current) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await checkInCampaignAttendance(campaignId, raw);
        if (cancelled) return;
        if (!res?.success) {
          throw new Error(res?.message || t('Check-in failed'));
        }
        finished.current = true;
        setAlready(Boolean(res.data?.already_checked_in));
        setModalOpen(true);
        void queryClient.invalidateQueries({ queryKey: ['campaign-volunteers'] });
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as {
          status?: number;
          message?: string;
          errors?: { message?: string; extensions?: { status_code?: number } }[];
        };
        const status = e?.status ?? e?.errors?.[0]?.extensions?.status_code;
        const msg =
          e?.errors?.[0]?.message ?? e?.message ?? t('Check-in failed');
        if (status === 403) {
          finished.current = true;
          toast.error(t('You are not an approved member of this campaign'));
          router.replace('/');
          return;
        }
        if (status === 401) {
          return;
        }
        finished.current = true;
        toast.error(msg);
        clearQuery();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, campaignId, campaign, isLoading, isError, t, router, clearQuery, queryClient]);

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) {
          setModalOpen(false);
          clearQuery();
        }
      }}
    >
      <DialogContent className="max-w-sm p-5">
        <DialogHeader>
          <DialogTitle>
            {already ? t('Already checked in') : t('Checked in successfully')}
          </DialogTitle>
          <DialogDescription>
            {already
              ? t('You had already checked in for this campaign.')
              : t('Your attendance has been recorded.')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="brown"
            size="medium"
            onClick={() => {
              setModalOpen(false);
              clearQuery();
            }}
          >
            {t('Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
