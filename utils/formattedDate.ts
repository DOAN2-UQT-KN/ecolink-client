import i18n from '@/i18n';

export const formattedDate = (date: string | undefined, showTime = false) => {
  if (!date) return '-';

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  const locale = currentLanguage.startsWith('vi') ? 'vi-VN' : 'en-US';

  return new Date(date).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(showTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};
