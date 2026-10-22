import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

type CopyButtonProps = {
  value: string;
  /** Accessible name, e.g. "Copy tracking code". */
  label: string;
  className?: string;
};

/** Icon button that copies `value` to the clipboard and confirms with a toast. */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const { t } = useTranslation();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Copied') });
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Could not copy') });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent',
        className,
      )}
    >
      <Copy className="size-4" aria-hidden />
    </button>
  );
}
