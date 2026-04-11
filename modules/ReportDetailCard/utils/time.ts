import { formatDistanceToNowStrict } from "date-fns";
import { vi, enGB } from "date-fns/locale";

/**
 * Custom relative time formatting logic:
 * - < 1 hour: "X minute ago"
 * - 1-24 hours: "X hour ago"
 * - 1-30 days: "X day ago"
 * - > 30 days: months/years logic
 */
export const getRelativeTime = (date: string | Date, locale: string = "vi") => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const dateLocale = locale === "vi" ? vi : enGB;

  // We use date-fns to handle the complexity of relative time
  return formatDistanceToNowStrict(d, {
    addSuffix: true,
    locale: dateLocale,
  });
};
