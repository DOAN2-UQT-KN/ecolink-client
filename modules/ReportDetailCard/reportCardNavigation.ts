import type React from "react";

/** Clicks on these keep their own behaviour (save, vote, menu, checkbox, image preview, links). */
const INTERACTIVE = "a,button,input,label,[role=checkbox],[role=menuitem],.ant-image";

/**
 * Mouse shortcut for report cards (specs/009 R3): the title is the real link, this makes the
 * rest of the card clickable. Modifier or middle click, or `newTab`, opens a new tab.
 */
export function openReportOnCardClick(
  e: React.MouseEvent,
  href: string,
  navigate: (href: string) => void,
  newTab = false,
): void {
  if (e.button > 1) return;
  // React bubbles clicks from portals (menus, dialogs opened from the card) up to the card.
  if (!e.currentTarget.contains(e.target as Node)) return;
  if ((e.target as Element).closest(INTERACTIVE)) return;
  if (window.getSelection()?.toString()) return;
  if (newTab || e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) {
    window.open(href, "_blank", "noopener");
    return;
  }
  navigate(href);
}
