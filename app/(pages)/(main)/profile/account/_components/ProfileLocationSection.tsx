import dynamic from '@/libs/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAddressFromLatLng,
  getLatLngFromAddress,
  getPlaceLocation,
  isSamePosition,
  normalizeAddressQuery,
  reverseCacheKey,
  type AddressSuggestion,
  type ForwardGeocodingResult,
  type LatLng,
  type ReverseGeocodingAddress,
} from '@/libs/geocoding';
import { useTranslation } from 'react-i18next';
import { AddressSearchField } from '@/components/form/AddressSearchField';
import { toast } from 'sonner';

import useAuthStore from '@/stores/useAuthStore';
import type { IUser } from '@/apis/auth/models/user';
import { updateUser } from '@/apis/user/updateUser';
import { Button } from '@/components/client/shared/Button';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/libs/utils';
import {
  DETAIL_ADDRESS_MAX_LENGTH,
  truncateDetailAddress,
} from '@/constants/address';

const AddressMap = dynamic(() => import('@/modules/AddressMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-xl bg-background/40 animate-pulse" />
  ),
});

const REVERSE_DEBOUNCE_MS = 400;
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
};

type AddressChangeSource = 'map' | 'gps' | 'user' | 'hydrate';

type AddressSnapshot = {
  detailAddress: string;
  position: LatLng | null;
};

function coordsFromUser(user: IUser | undefined): LatLng | null {
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

function detailAddressFromUser(user: IUser | undefined): string {
  return truncateDetailAddress(user?.detail_address ?? '');
}

function hasPersistedLocation(user: IUser | undefined): boolean {
  return coordsFromUser(user) != null;
}

export function ProfileLocationSection() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [position, setPosition] = useState<LatLng | null>(null);
  const [detailAddress, setDetailAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [forwardWarning, setForwardWarning] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseCacheRef = useRef<Map<string, ReverseGeocodingAddress>>(new Map());
  const forwardCacheRef = useRef<Map<string, ForwardGeocodingResult>>(new Map());
  const skipReverseRef = useRef(false);
  const isEditingRef = useRef(false);
  const snapshotRef = useRef<AddressSnapshot | null>(null);
  const searchGenerationRef = useRef(0);
  const hydratedUserIdRef = useRef<string | null>(null);
  const autoGpsAttemptedRef = useRef(false);

  isEditingRef.current = isEditing;

  const applyPosition = useCallback((newPos: LatLng, source: AddressChangeSource) => {
    if (source === 'user' || source === 'hydrate') {
      skipReverseRef.current = true;
    }
    setPosition(newPos);
  }, []);

  const writeDetailAddressFromReverse = useCallback((text: string) => {
    if (isEditingRef.current) return;
    setForwardWarning(null);
    setDetailAddress(truncateDetailAddress(text));
  }, []);

  // Hydrate from saved user location (skip reverse when address already stored).
  useEffect(() => {
    if (!user?.id) return;
    if (hydratedUserIdRef.current === user.id) return;

    const saved = coordsFromUser(user);
    const savedAddress = detailAddressFromUser(user);
    hydratedUserIdRef.current = user.id;

    if (saved) {
      setDetailAddress(savedAddress);
      applyPosition(saved, 'hydrate');
      // Coords only, no address → allow one reverse fill.
      if (!savedAddress) {
        skipReverseRef.current = false;
      }
      return;
    }

    setDetailAddress('');
    setPosition(null);
  }, [applyPosition, user]);

  // Auto GPS once when no saved location.
  useEffect(() => {
    if (!user?.id) return;
    if (hasPersistedLocation(user)) return;
    if (autoGpsAttemptedRef.current) return;
    if (!navigator.geolocation) return;

    autoGpsAttemptedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps');
      },
      () => {},
      GPS_OPTIONS,
    );
  }, [applyPosition, user]);

  useEffect(() => {
    if (!position) return;

    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }

    const cacheKey = reverseCacheKey(position.lat, position.lng);
    const cachedResult = reverseCacheRef.current.get(cacheKey);

    if (cachedResult) {
      if (cachedResult.detailAddress) {
        writeDetailAddressFromReverse(cachedResult.detailAddress);
      }
      return;
    }

    if (reverseTimerRef.current) {
      clearTimeout(reverseTimerRef.current);
    }

    reverseTimerRef.current = setTimeout(async () => {
      try {
        const parsedAddress = await getAddressFromLatLng(position.lat, position.lng);
        reverseCacheRef.current.set(cacheKey, parsedAddress);

        if (parsedAddress.detailAddress) {
          writeDetailAddressFromReverse(parsedAddress.detailAddress);
        }
      } catch {
        // Keep manual values untouched when reverse geocoding fails.
      }
    }, REVERSE_DEBOUNCE_MS);

    return () => {
      if (reverseTimerRef.current) {
        clearTimeout(reverseTimerRef.current);
      }
    };
  }, [position, writeDetailAddressFromReverse]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCanConfirm(false);
        applyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps');
      },
      () => {
        toast.error(t('No location on device'));
      },
      GPS_OPTIONS,
    );
  }, [applyPosition, t]);

  const handleMapPosition = useCallback(
    (pos: LatLng) => {
      setCanConfirm(false);
      applyPosition(pos, 'map');
    },
    [applyPosition],
  );

  const startEditing = useCallback(() => {
    snapshotRef.current = {
      detailAddress,
      position,
    };
    setSearchQuery(detailAddress);
    setCanConfirm(false);
    setForwardWarning(null);
    setIsEditing(true);
  }, [detailAddress, position]);

  const exitEditing = useCallback(() => {
    searchGenerationRef.current += 1;
    snapshotRef.current = null;
    setCanConfirm(false);
    setForwardWarning(null);
    setIsSearching(false);
    setSearchQuery('');
    setIsEditing(false);
  }, []);

  /** `pick`: a suggestion from the autocomplete, resolved by place id instead of a text search. */
  const handleSearch = useCallback(async (pick?: AddressSuggestion) => {
    const query = (pick?.description ?? searchQuery).trim();
    if (!query) {
      setCanConfirm(false);
      setForwardWarning(t('Please enter an address to search'));
      return;
    }

    setIsSearching(true);
    setCanConfirm(false);
    const generation = ++searchGenerationRef.current;

    const cacheKey = pick ? `place:${pick.placeId}` : normalizeAddressQuery(query);
    const cached = forwardCacheRef.current.get(cacheKey);
    const result = cached ?? (await (pick ? getPlaceLocation(pick.placeId) : getLatLngFromAddress(query)));

    if (generation !== searchGenerationRef.current || !isEditingRef.current) {
      return;
    }

    if (!cached) {
      forwardCacheRef.current.set(cacheKey, result);
    }

    setIsSearching(false);

    if (!result.ok) {
      setForwardWarning(
        result.reason === 'not_found'
          ? t('Location not found. Please enter a different address.')
          : t('Could not look up this address.'),
      );
      return;
    }

    setForwardWarning(null);
    if (result.displayName) {
      setSearchQuery(truncateDetailAddress(result.displayName));
    }
    const nextPos = { lat: result.lat, lng: result.lng };
    if (!isSamePosition(position, nextPos)) {
      applyPosition(nextPos, 'user');
    }
    setCanConfirm(true);
  }, [applyPosition, position, searchQuery, t]);

  const handleConfirm = useCallback(async () => {
    if (!user?.id) {
      toast.error(t('Please login again.'));
      return;
    }
    if (position == null) {
      toast.error(t('Pick a location on the map first'));
      return;
    }

    const nextAddress = truncateDetailAddress(
      canConfirm ? searchQuery : detailAddress,
    );

    setSaving(true);
    try {
      const res = await updateUser(user.id, {
        latitude: position.lat,
        longitude: position.lng,
        detail_address: nextAddress || null,
      });
      const nextUser = res?.data?.user;
      if (nextUser) setUser(nextUser);
      setDetailAddress(nextAddress);
      toast.success(t('Updated successfully'));
      searchGenerationRef.current += 1;
      snapshotRef.current = null;
      setCanConfirm(false);
      setForwardWarning(null);
      setIsSearching(false);
      setSearchQuery('');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to save location'));
    } finally {
      setSaving(false);
    }
  }, [canConfirm, detailAddress, position, searchQuery, setUser, t, user?.id]);

  const handleCancel = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      skipReverseRef.current = true;
      setDetailAddress(snapshot.detailAddress);
      setPosition(snapshot.position);
    }
    exitEditing();
  }, [exitEditing]);

  const lastUpdatedLabel = useMemo(() => {
    const raw =
      user?.locationUpdatedAt ??
      (user as Record<string, unknown> | undefined)?.location_updated_at;
    if (typeof raw !== 'string' || !raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  }, [user?.locationUpdatedAt]);

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">{t('Profile location')}</h2>
      <p className="mt-1 text-sm text-foreground-secondary">{t('Profile location hint')}</p>
      {lastUpdatedLabel ? (
        <p className="mt-2 text-xs text-foreground-secondary">
          {t('Location last updated')}: {lastUpdatedLabel}
        </p>
      ) : null}

      <Field className="mt-4 w-full gap-2">
        {/* <FieldLabel className="text-xs text-foreground-secondary">{t('Detail address')}</FieldLabel> */}

        {!isEditing ? (
          <>
            <p
              className={cn(
                'min-h-16 rounded-md border border-[rgba(136,122,71,0.35)] bg-muted/40 px-2.5 py-2 text-sm leading-relaxed',
                detailAddress ? 'text-foreground' : 'text-foreground-tertiary',
              )}
            >
              {detailAddress || t('Street, district, city...')}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outlined-brown"
                
                className="w-fit"
                onClick={startEditing}
                disabled={saving}
              >
                {t('Edit')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSearch();
              }}
              className="w-full"
            >
              <AddressSearchField
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setCanConfirm(false);
                  setForwardWarning(null);
                }}
                onPick={(suggestion) => {
                  setSearchQuery(suggestion.description);
                  void handleSearch(suggestion);
                }}
                loading={isSearching}
                warning={!!forwardWarning}
                disabled={saving}
                maxLength={DETAIL_ADDRESS_MAX_LENGTH}
                near={position}
              />
            </form>
            {forwardWarning && (
              <p role="status" className="text-sm font-normal text-amber-700">
                {forwardWarning}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outlined-brown"
                
                onClick={useCurrentLocation}
                disabled={saving || isSearching}
              >
                {t('Use current location')}
              </Button>
              <Button
                type="button"
                variant="brown"
                
                isDisabled={position == null || isSearching || saving}
                isLoading={saving}
                onClick={() => void handleConfirm()}
              >
                {t('Confirm')}
              </Button>
              <Button
                type="button"
                variant="outlined-brown"
                
                onClick={handleCancel}
                disabled={saving}
              >
                {t('Cancel')}
              </Button>
            </div>
          </>
        )}
      </Field>

      <div className="mt-4 h-[280px] overflow-hidden rounded-xl border border-[rgba(136,122,71,0.35)]">
        <AddressMap
          position={position}
          setPosition={handleMapPosition}
          popupText={detailAddress || t('Selected location')}
        />
      </div>
    </section>
  );
}
