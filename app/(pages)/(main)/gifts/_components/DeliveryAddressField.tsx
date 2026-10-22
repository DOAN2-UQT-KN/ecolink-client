import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocateFixed } from 'lucide-react';

import { AddressSearchField } from '@/components/form/AddressSearchField';
import {
  getAddressFromLatLng,
  getLatLngFromAddress,
  getPlaceLocation,
  reverseCacheKey,
  type AddressSuggestion,
  type LatLng,
} from '@/libs/geocoding';
import dynamic from '@/libs/dynamic';
import type { DeliveryAddressValue } from '../_services/redeemForm.service';

const AddressMap = dynamic(() => import('@/modules/AddressMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />,
});

const REVERSE_DEBOUNCE_MS = 400;

type Props = {
  value: DeliveryAddressValue;
  onChange: (value: DeliveryAddressValue) => void;
  disabled?: boolean;
};

/**
 * Delivery address of a gift order: Goong autocomplete or a text search moves the pin; clicking the map
 * moves the pin and fills the address by reverse geocoding. The order keeps both the text and the pin.
 */
export function DeliveryAddressField({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value.address);
  const [searching, setSearching] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const reverseCache = useRef(new Map<string, string>());
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const position: LatLng | null = value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null;

  // The search box follows addresses written from outside (reverse geocoding, form reset).
  useEffect(() => setQuery(value.address), [value.address]);
  useEffect(() => () => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
  }, []);

  const search = useCallback(
    async (pick?: AddressSuggestion) => {
      const q = (pick?.description ?? query).trim();
      if (!q) {
        setWarning(t('Enter an address to search'));
        return;
      }
      setSearching(true);
      const result = await (pick ? getPlaceLocation(pick.placeId) : getLatLngFromAddress(q));
      setSearching(false);
      if (!result.ok) {
        setWarning(
          result.reason === 'not_found'
            ? t('Location not found. Please enter a different address.')
            : t('Could not look up this address.'),
        );
        return;
      }
      setWarning(null);
      onChange({ address: result.displayName || q, lat: result.lat, lng: result.lng });
    },
    [onChange, query, t],
  );

  const placePin = useCallback(
    (pos: LatLng) => {
      onChange({ address: value.address, lat: pos.lat, lng: pos.lng });
      const key = reverseCacheKey(pos.lat, pos.lng);
      const cached = reverseCache.current.get(key);
      if (cached) {
        onChange({ address: cached, lat: pos.lat, lng: pos.lng });
        return;
      }
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      reverseTimer.current = setTimeout(async () => {
        try {
          const { detailAddress } = await getAddressFromLatLng(pos.lat, pos.lng);
          if (!detailAddress) return;
          reverseCache.current.set(key, detailAddress);
          onChange({ address: detailAddress, lat: pos.lat, lng: pos.lng });
        } catch {
          // Keep the typed address when reverse geocoding fails; the pin is still saved.
        }
      }, REVERSE_DEBOUNCE_MS);
    },
    [onChange, value.address],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWarning(t('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => placePin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setWarning(t('No location on device')),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="min-w-0 space-y-2">
      {/* Own form: Enter / the search button look the address up instead of submitting the order. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void search();
        }}
      >
        <AddressSearchField
          value={query}
          onChange={(v) => {
            setQuery(v);
            setWarning(null);
          }}
          onPick={(s) => {
            setQuery(s.description);
            void search(s);
          }}
          loading={searching}
          disabled={disabled}
          warning={!!warning}
          maxLength={1000}
          near={position}
        />
      </form>
      {warning ? (
        <p role="status" className="text-sm text-amber-700">
          {warning}
        </p>
      ) : null}
      <div className="relative z-0 h-[220px] w-full overflow-hidden rounded-lg border border-[rgba(136,122,71,0.35)]">
        <AddressMap position={position} setPosition={placePin} popupText={value.address || t('Selected location')} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-secondary">
        <span>{position ? t('Tap the map to move the pin.') : t('Search an address or tap the map to drop a pin.')}</span>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={disabled}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 font-medium text-button-accent hover:bg-[rgba(136,122,71,0.08)] disabled:opacity-50"
        >
          <LocateFixed className="size-4" aria-hidden />
          {t('Use current location')}
        </button>
      </div>
    </div>
  );
}
