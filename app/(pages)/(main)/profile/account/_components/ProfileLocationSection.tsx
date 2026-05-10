'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LatLngLiteral } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import useAuthStore from '@/stores/useAuthStore';
import type { IUser } from '@/apis/auth/models/user';
import { updateUser } from '@/apis/user/updateUser';
import { Button } from '@/components/client/shared/Button';

const LeafletAddressMap = dynamic(() => import('@/modules/LeafletAddressMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-xl bg-background/40 animate-pulse" />
  ),
});

function coordsFromUser(user: IUser | undefined): LatLngLiteral | null {
  if (!user) return null;
  const lat = user.latitude;
  const lng = user.longitude;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    return { lat, lng };
  }
  return null;
}

function hasPersistedLocation(user: IUser | undefined): boolean {
  return coordsFromUser(user) != null;
}

export function ProfileLocationSection() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [draft, setDraft] = useState<LatLngLiteral | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(coordsFromUser(user));
  }, [user?.id, user?.latitude, user?.longitude]);

  const popupText = useMemo(() => {
    if (!draft) return t('Click map to set location');
    return `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`;
  }, [draft, t]);

  const useGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        toast.error(t('No location on device'));
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }, [t]);

  const saveLocation = async () => {
    if (!user?.id) {
      toast.error(t('Please login again.'));
      return;
    }
    if (draft == null) {
      toast.error(t('Pick a location on the map first'));
      return;
    }
    setSaving(true);
    try {
      const res = await updateUser(user.id, {
        latitude: draft.lat,
        longitude: draft.lng,
      });
      const nextUser = res?.data?.user;
      if (nextUser) setUser(nextUser);
      toast.success(t('Updated successfully'));
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to save location'));
    } finally {
      setSaving(false);
    }
  };

  const clearOrReset = async () => {
    if (!user?.id) {
      toast.error(t('Please login again.'));
      return;
    }
    const saved = hasPersistedLocation(user);
    if (!saved && draft != null) {
      setDraft(null);
      return;
    }
    if (!saved) return;

    setSaving(true);
    try {
      const res = await updateUser(user.id, {
        latitude: null,
        longitude: null,
      });
      const nextUser = res?.data?.user;
      if (nextUser) setUser(nextUser);
      setDraft(null);
      toast.success(t('Updated successfully'));
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to clear location'));
    } finally {
      setSaving(false);
    }
  };

  const lastUpdatedLabel = useMemo(() => {
    const raw =
      user?.locationUpdatedAt ??
      (user as Record<string, unknown> | undefined)?.location_updated_at;
    if (typeof raw !== 'string' || !raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  }, [user?.locationUpdatedAt]);

  const clearDisabled =
    saving || (!hasPersistedLocation(user) && draft == null);

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">{t('Profile location')}</h2>
      <p className="mt-1 text-sm text-foreground-secondary">{t('Profile location hint')}</p>
      {lastUpdatedLabel ? (
        <p className="mt-2 text-xs text-foreground-secondary">
          {t('Location last updated')}: {lastUpdatedLabel}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outlined-brown" size="small" type="button" onClick={useGps} disabled={saving}>
          {t('Use current location')}
        </Button>
        <Button
          variant="brown"
          size="small"
          type="button"
          onClick={() => void saveLocation()}
          disabled={saving || draft == null}
        >
          {saving ? t('Saving...') : t('Save location')}
        </Button>
        <Button
          variant="outlined-brown"
          size="small"
          type="button"
          onClick={() => void clearOrReset()}
          disabled={clearDisabled}
        >
          {hasPersistedLocation(user) ? t('Clear saved location') : t('Reset map selection')}
        </Button>
      </div>

      <div className="mt-4 h-[280px] overflow-hidden rounded-xl border border-[rgba(136,122,71,0.35)]">
        <LeafletAddressMap position={draft} setPosition={setDraft} popupText={popupText} />
      </div>
    </section>
  );
}
