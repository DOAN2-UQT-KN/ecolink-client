'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import useAuthStore from '@/stores/useAuthStore';
import { Button } from '@/components/client/shared/Button';
import { clearAuthStorage } from '@/utils/logout';
import defaultAvatar from '@/public/default-avatar.png';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import { updateUser } from '@/apis/user/updateUser';

export default function AccountPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setLogoutSuccess, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const displayName = useMemo(() => {
    const anyUser = user as unknown as
      | { name?: string; full_name?: string; email?: string }
      | undefined;
    return (anyUser?.name ?? anyUser?.full_name ?? anyUser?.email ?? '').trim() || '-';
  }, [user]);

  const email = useMemo(() => {
    const anyUser = user as unknown as { email?: string } | undefined;
    return (anyUser?.email ?? '').trim() || '-';
  }, [user]);

  const avatarSrc = useMemo(() => {
    const anyUser = user as unknown as { avatar?: string | null } | undefined;
    return anyUser?.avatar || defaultAvatar;
  }, [user]);

  const handlePickAvatar = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!user?.id) {
      toast.error(t('Please login again.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('Please choose an image file.'));
      return;
    }

    setAvatarUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const res = await updateUser(user.id, { avatar: url });
      const nextUser = res?.data?.user;
      if (nextUser) setUser(nextUser);
      toast.success(t('Updated successfully'));
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to upload image'));
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          {/* <div>
            <h1 className="text-lg font-semibold">{t('Account')}</h1>
            <p className="text-sm text-foreground-secondary">{t('Manage your profile and session')}</p>
          </div> */}

          <div className="mt-3 flex items-center justify-end w-full gap-2 sm:mt-0">
            <Button
              variant="brown"
              onClick={() => {
                clearAuthStorage();
                setLogoutSuccess();
                router.push('/authenticate');
              }}
            >
              {t('Logout')}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background/20 p-4 sm:col-span-1">
            <p className="text-xs text-foreground-secondary">{t('Avatar')}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[rgba(136,122,71,0.35)] bg-white">
                <Image src={avatarSrc} alt="avatar" fill className="object-cover" />
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
                <Button
                  variant="outlined-brown"
                  size="small"
                  onClick={handlePickAvatar}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? t('Uploading...') : t('Change avatar')}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
            <p className="text-xs text-foreground-secondary">{t('Name')}</p>
            <p className="mt-1 text-sm font-semibold text-foreground-primary">{displayName}</p>
          </div>

          <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
            <p className="text-xs text-foreground-secondary">{t('Email')}</p>
            <p className="mt-1 text-sm font-semibold text-foreground-primary">{email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-button-accent">{t('Security')}</h2>
        <p className="mt-1 font-display-1 text-button-accent-hover">
          {t('If you suspect your account is compromised, please logout and login again.')}
        </p>
      </section>
    </div>
  );
}
