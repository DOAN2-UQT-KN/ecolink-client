import { memo, useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/libs/utils';

/** The bordered section card of the detail pages. */
export const sectionCardClass =
  'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm';

/**
 * A section card whose body folds away under its title. `actions` sit right of the title and
 * do not toggle it.
 */
export const CollapsibleCard = memo(function CollapsibleCard({
  title,
  actions,
  defaultOpen = true,
  className,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className={cn(sectionCardClass, className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-button-accent"
            aria-hidden
          >
            <ChevronDown className="size-5" />
          </motion.span>
          <h2 className="font-display-6 font-semibold text-button-accent">{title}</h2>
        </button>
        {actions && open ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

export default CollapsibleCard;
