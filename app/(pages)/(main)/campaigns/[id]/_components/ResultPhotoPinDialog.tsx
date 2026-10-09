import { memo, useState } from 'react';
import type { LatLngLiteral } from 'leaflet';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from '@/libs/dynamic';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { getCurrentPosition, hasGeolocation } from '@/libs/geo';

const LeafletAddressMap = dynamic(() => import('@/modules/LeafletAddressMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />,
});

/**
 * Where the photos were taken (result verification, Layer 1): the uploader pins it on the map,
 * starting at the waste point. The server compares the pin with the waste point and with the
 * photo's own GPS.
 */
export const ResultPhotoPinDialog = memo(function ResultPhotoPinDialog({
  open,
  count,
  defaultPin,
  pointTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** Photos waiting for the pin. */
  count: number;
  /** The waste point's location, when it has one. */
  defaultPin: LatLngLiteral | null;
  pointTitle: string;
  onCancel: () => void;
  onConfirm: (pin: LatLngLiteral) => void;
}) {
  const { t } = useTranslation('common');
  const [position, setPosition] = useState<LatLngLiteral | null>(defaultPin);

  // Start from the waste point every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPosition(defaultPin);
  }

  const useCurrentLocation = async () => {
    if (!hasGeolocation()) {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Geolocation is not supported') });
      return;
    }
    const pos = await getCurrentPosition({ maximumAge: 0 });
    if (pos) setPosition({ lat: pos.lat, lng: pos.lng });
    else showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('No location on device') });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Where were these photos taken?')}</DialogTitle>
          <DialogDescription>
            {t(
              'Click the map where the {{n}} photo(s) were taken; it starts at the waste point. The photos are checked against this pin and the waste point.',
              { n: count },
            )}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium">{pointTitle}</p>
        <div className="relative z-0 h-[360px] w-full overflow-hidden rounded-xl border">
          {open && (
            <LeafletAddressMap position={position} setPosition={setPosition} popupText={t('Where the photos were taken')} />
          )}
        </div>
        {!defaultPin && <p className="text-xs text-amber-700">{t('This waste point has no location; pin where you were.')}</p>}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outlined-brown" size="medium" onClick={useCurrentLocation}>
            {t('Use current location')}
          </Button>
          <Button type="button" variant="outlined-brown" size="medium" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            variant="brown"
            size="medium"
            isDisabled={!position}
            onClick={() => position && onConfirm(position)}
          >
            {t('Upload photos')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ResultPhotoPinDialog;
