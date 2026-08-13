import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import useAuthStore from '@/stores/useAuthStore';
import { updateUser } from '@/apis/user/updateUser';
import { Checkbox } from '@/components/ui/checkbox';
import {
  NOTIFICATION_PREFERENCE_KEYS,
  NOTIFICATION_PREFERENCE_LABEL_KEYS,
  type NotificationPreferenceKey,
  readUserNotificationPreferences,
  toApiNotificationPreferencesPatch,
} from '@/constants/notificationPreferences';

export function ProfileNotificationSection() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [savingKey, setSavingKey] = useState<NotificationPreferenceKey | null>(null);

  const prefs = useMemo(() => readUserNotificationPreferences(user), [user]);

  const onToggle = useCallback(
    async (key: NotificationPreferenceKey, enabled: boolean) => {
      if (!user?.id) {
        toast.error(t('Please login again.'));
        return;
      }
      setSavingKey(key);
      try {
        const res = await updateUser(user.id, {
          notification_preferences: toApiNotificationPreferencesPatch({ [key]: enabled }),
        });
        const nextUser = res?.data?.user;
        if (nextUser) setUser(nextUser);
        toast.success(t('Updated successfully'));
      } catch (err) {
        console.error(err);
        toast.error(t('Failed to update notification settings'));
      } finally {
        setSavingKey(null);
      }
    },
    [setUser, t, user?.id],
  );

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">
        {t('Notification preferences')}
      </h2>
      <p className="mt-1 text-sm text-foreground-secondary">
        {t('Notification preferences hint')}
      </p>

      <ul className="mt-4 space-y-3">
        {NOTIFICATION_PREFERENCE_KEYS.map((key) => {
          const disabled = savingKey != null;
          const labelKey = NOTIFICATION_PREFERENCE_LABEL_KEYS[key];
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 px-4 py-3">
                <Checkbox
                  checked={prefs[key]}
                  disabled={disabled}
                  onCheckedChange={(v) => void onToggle(key, v === true)}
                  aria-label={t(labelKey)}
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground-primary leading-snug">
                  {t(labelKey)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
