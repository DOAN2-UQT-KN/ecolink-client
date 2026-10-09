import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbClipboardCheck } from 'react-icons/tb';

import dynamic from '@/libs/dynamic';
import { cn } from '@/libs/utils';
import { DialogLoading } from './DialogLoading';

// The review form and its evidence load only when an admin first opens one.
const CompletionReviewDialog = dynamic(() => import('./CompletionReviewDialog'), {
  loading: () => <DialogLoading />,
});

/** Row action for a campaign awaiting completion review. */
export function CompletionReviewButton({
  campaignId,
  campaignTitle,
  theme,
}: {
  campaignId: string;
  campaignTitle: string;
  theme: 'light' | 'dark';
}) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  // Bumped on every open: remounts the dialog so its form starts empty.
  const [session, setSession] = useState(0);

  return (
    <>
      <button
        type="button"
        title={t('Review campaign completion')}
        onClick={() => {
          setSession((n) => n + 1);
          setOpen(true);
        }}
        className={cn(
          'rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200',
          isDark
            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
            : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
        )}
      >
        <TbClipboardCheck className="size-5" />
      </button>
      {session > 0 && (
        <CompletionReviewDialog
          key={session}
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          theme={theme}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
