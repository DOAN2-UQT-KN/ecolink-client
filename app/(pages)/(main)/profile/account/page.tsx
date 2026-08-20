'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from '@/libs/router';

import useAuthStore from '@/stores/useAuthStore';
import { Button } from '@/components/client/shared/Button';
import { clearAuthStorage } from '@/utils/logout';
import { signOut } from '@/apis/auth/signOut';
import { ProfileGeneralInformation } from './_components/ProfileGeneralInformation';
import { ProfileLocationSection } from './_components/ProfileLocationSection';

export default function AccountPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setLogoutSuccess } = useAuthStore();

  return (
    <div className="space-y-4">
      <ProfileGeneralInformation />

      <ProfileLocationSection />

      <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-button-accent">{t('Security')}</h2>
            <p className="mt-1 font-display-1 text-button-accent-hover">
              {t('If you suspect your account is compromised, please logout and login again.')}
            </p>
          </div>
          <Button
            variant="brown"
            onClick={() => {
              void (async () => {
                try {
                  await signOut();
                } catch {
                  // Local logout still proceeds if the API is unreachable.
                }
                clearAuthStorage();
                setLogoutSuccess();
                router.push('/authenticate');
              })();
            }}
          >
            {t('Logout')}
          </Button>
        </div>
      </section>
    </div>
  );
}
