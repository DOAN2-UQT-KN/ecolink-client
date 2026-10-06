import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image as AntdImage } from 'antd';
import { Inbox } from 'lucide-react';
import {
  TbAlertTriangle,
  TbCircleCheck,
  TbClock,
  TbCurrentLocation,
  TbHandStop,
  TbMapPin,
  TbPhone,
  TbRoute,
  TbShieldCheck,
} from 'react-icons/tb';

import { useSos } from '@/apis/sos/getSosById';
import { useClaimSos, useUpdateSosLocation } from '@/apis/sos/manageSos';
import type { ISosDetail, ISosDetailResponse } from '@/apis/sos/models/sos';
import { useCancelRespond, useRespondSos } from '@/apis/sos/respondSos';
import { AvatarList } from '@/app/(pages)/(main)/campaigns/[id]/_components/AvatarList';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/client/shared/Button';
import { Call115Banner } from '@/components/sos/Call115Banner';
import { SosStatePill, SosTypeBadge } from '@/components/sos/SosTypeBadge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SOS_CONSCIOUSNESS,
  SOS_HAZARD_KINDS,
  SOS_RESOLUTION_CODES,
  SOS_ROLE_LABEL,
  SOS_TOOLS,
  SOS_TYPE_META,
  isSosOpen,
} from '@/constants/sos';
import { useGeoPosition } from '@/hooks/useGeoPosition';
import { etaMinutes, getCurrentPosition, googleDirectionsUrl, haversineMeters, type GeoPoint } from '@/libs/geo';
import { Link, useParams } from '@/libs/router';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import { ResolveSosDialog } from './_components/ResolveSosDialog';
import { useResponderTracking } from './_hooks/useResponderTracking';

const cardClass = 'rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm';
const labelOf = <T extends string>(list: { value: T; label: string }[], value?: T | null) =>
  list.find((x) => x.value === value)?.label;

function formatDistance(meters: number, t: (k: string, o?: Record<string, unknown>) => string) {
  return meters < 1000
    ? t('{{m}} m', { m: Math.round(meters) })
    : t('{{km}} km', { km: (meters / 1000).toFixed(1) });
}

/** One SOS (spec "Tương tác 2 chiều"): counter, directions, respond, and the team's actions. */
function SosDetailBody({ sosId }: { sosId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSos(sosId, { enabled: Number.isFinite(sosId) });
  const sos = data?.data;

  const geo = useGeoPosition();
  const [livePosition, setLivePosition] = useState<GeoPoint | null>(null);
  const viewer = livePosition ?? geo.position;
  const [resolveOpen, setResolveOpen] = useState(false);

  const setDetail = useCallback(
    (res: ISosDetailResponse) => {
      queryClient.setQueryData(['sos-detail', sosId], res);
    },
    [queryClient, sosId],
  );

  const respond = useRespondSos({ onSuccess: setDetail });
  const cancelRespond = useCancelRespond({ onSuccess: setDetail });
  const claim = useClaimSos({ onSuccess: setDetail });
  const updateLocation = useUpdateSosLocation({ onSuccess: setDetail });
  const [locating, setLocating] = useState(false);

  const onTheWay = Boolean(sos && sos.my_response === 'on_the_way' && isSosOpen(sos.state));
  useResponderTracking(sosId, onTheWay, setLivePosition);

  const distance = useMemo(
    () =>
      sos && viewer
        ? haversineMeters(viewer, { lat: Number(sos.latitude), lng: Number(sos.longitude) })
        : null,
    [sos, viewer],
  );

  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: t('Home'), path: '/', type: 'link' },
    ...(sos?.campaign
      ? [{ label: sos.campaign.title, path: `/campaigns/${sos.campaign.id}`, type: 'link' as const }]
      : []),
    { label: t('SOS #{{id}}', { id: sosId }), path: `/sos/${sosId}`, type: 'page' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pb-10 space-y-4 pt-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !sos) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('SOS not found')}</EmptyTitle>
              <EmptyDescription>{t("We couldn't find the SOS you were looking for.")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  const open = isSosOpen(sos.state);
  const meta = SOS_TYPE_META[sos.type];
  const Icon = meta.icon;
  const perms = sos.permissions;

  const handleUpdateLocation = async () => {
    setLocating(true);
    const p = await getCurrentPosition();
    setLocating(false);
    if (!p) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t('Could not get your location. Allow location access and try again.'),
      });
      return;
    }
    try {
      await updateLocation.mutateAsync({ id: sos.id, latitude: p.lat, longitude: p.lng });
    } catch {
      // usePost surfaces API errors.
    }
  };

  const run = (fn: () => Promise<unknown>) => () => {
    fn().catch(() => {
      // usePost surfaces API errors.
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5 flex flex-col gap-5">
        {sos.type === 'medical' && open ? <Call115Banner /> : null}

        {sos.type === 'hazard' ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border-2 border-sos-hazard/40 bg-sos-hazard/10 px-4 py-3"
          >
            <TbAlertTriangle className="mt-0.5 size-6 shrink-0 text-sos-hazard" aria-hidden />
            <p className="font-semibold text-sos-hazard">
              {t('Do not touch it, keep your distance and wait for the authorities.')}
            </p>
          </div>
        ) : null}

        {/* Header */}
        <div className={cn(cardClass, 'border-2', meta.borderClass)}>
          <div className="flex flex-wrap items-start gap-4">
            <span
              className={cn(
                'flex size-14 shrink-0 items-center justify-center rounded-full',
                meta.bgClass,
                meta.textClass,
              )}
            >
              <Icon className="size-8" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <SosTypeBadge type={sos.type} />
                <SosStatePill state={sos.state} />
                {sos.is_mine ? <Pill tone="brand">{t('Your SOS')}</Pill> : null}
              </div>
              <h2 className="font-display-6 font-semibold text-button-accent">
                {t('SOS #{{id}}', { id: sos.id })} · {t(meta.label)}
              </h2>
              <p className="text-sm text-foreground-secondary">
                {t('Sent at {{time}}', { time: format(new Date(sos.created_at), 'HH:mm, dd/MM/yyyy') })}
                {sos.reporter_role ? ` · ${t(SOS_ROLE_LABEL[sos.reporter_role])}` : ''}
              </p>
              <p className="text-sm">
                <Link href={`/campaigns/${sos.campaign.id}`} className="text-button-accent underline">
                  {sos.campaign.title}
                </Link>
                {sos.meeting_point ? ` · ${sos.meeting_point.name}` : ''}
                {sos.shift
                  ? ` · ${format(new Date(sos.shift.start_at), 'HH:mm')}–${format(new Date(sos.shift.end_at), 'HH:mm')}`
                  : ''}
              </p>
            </div>
          </div>

          {/* Counter (manpower / medical) */}
          {sos.type !== 'hazard' ? (
            <div className="mt-4 rounded-lg bg-background-primary px-4 py-3">
              <p className="text-lg font-semibold text-foreground">
                {sos.type === 'manpower' && sos.people_needed
                  ? t('{{count}} / {{needed}} people on the way', {
                      count: sos.on_the_way_count + sos.arrived_count,
                      needed: sos.people_needed,
                    })
                  : t('{{count}} people are coming to help', {
                      count: sos.on_the_way_count + sos.arrived_count,
                    })}
              </p>
              {sos.arrived_count > 0 ? (
                <p className="text-sm text-foreground-secondary">
                  {t('{{onWay}} on the way · {{arrived}} arrived', {
                    onWay: sos.on_the_way_count,
                    arrived: sos.arrived_count,
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Responder actions */}
          {open && (perms.can_respond || perms.can_cancel_response || sos.my_response) ? (
            <div className="mt-4 flex flex-col gap-2">
              {sos.my_response === 'arrived' ? (
                <Pill tone="green" className="text-sm">
                  <TbCircleCheck className="size-4" aria-hidden />
                  {t('You have arrived')}
                </Pill>
              ) : sos.my_response === 'on_the_way' ? (
                <Pill tone="blue" className="text-sm">
                  {t('You are on the way. Your location is shared every 30 seconds until you arrive.')}
                </Pill>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {perms.can_respond ? (
                  <Button
                    type="button"
                    variant="green"
                    size="medium"
                    isLoading={respond.isPending}
                    iconLeft={<TbHandStop className="size-5" aria-hidden />}
                    onClick={run(() => respond.mutateAsync(sos.id))}
                  >
                    {t("I'm coming to help now")}
                  </Button>
                ) : null}
                {perms.can_cancel_response ? (
                  <Button
                    type="button"
                    variant="outlined-brown"
                    size="medium"
                    isLoading={cancelRespond.isPending}
                    onClick={run(() => cancelRespond.mutateAsync(sos.id))}
                  >
                    {t("I can't come anymore")}
                  </Button>
                ) : null}
              </div>
              {sos.type === 'medical' && perms.can_respond ? (
                <p className="text-xs text-foreground-tertiary">
                  {t('Help with first aid and transport; this does not replace emergency services.')}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Closed states */}
        {!open ? <ClosedNotice sos={sos} /> : null}
        {sos.state === 'escalated' ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {t('Nobody took charge in time: an admin is contacting the reporter and the campaign team.')}
          </p>
        ) : null}

        {/* Location */}
        <div className={cardClass}>
          <h2 className="font-display-6 font-semibold text-button-accent mb-3">{t('Location')}</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-sm">
              {distance != null ? (
                <span className="flex items-center gap-1.5 font-medium">
                  <TbMapPin className="size-4" aria-hidden />
                  {t('{{distance}} away · about {{min}} min', {
                    distance: formatDistance(distance, t),
                    min: etaMinutes(distance),
                  })}
                </span>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-button-accent underline"
                  onClick={() => void geo.request()}
                >
                  <TbCurrentLocation className="size-4" aria-hidden />
                  {t('Show distance from me')}
                </button>
              )}
              {sos.location_updated_at ? (
                <span className="text-xs text-foreground-tertiary">
                  {t('Location updated at {{time}}', {
                    time: format(new Date(sos.location_updated_at), 'HH:mm'),
                  })}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {perms.can_update_location && open ? (
                <Button
                  type="button"
                  variant="outlined-brown"
                  size="medium"
                  isLoading={locating || updateLocation.isPending}
                  iconLeft={<TbCurrentLocation className="size-5" aria-hidden />}
                  onClick={() => void handleUpdateLocation()}
                >
                  {t('Update to my location')}
                </Button>
              ) : null}
              <a
                href={googleDirectionsUrl(Number(sos.latitude), Number(sos.longitude))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="button"
                  variant="brown"
                  size="medium"
                  iconLeft={<TbRoute className="size-5" aria-hidden />}
                >
                  {t('Directions')}
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Details */}
        <DetailsCard sos={sos} />

        {/* Contacts and safety */}
        {sos.phone || sos.reporter || sos.campaign.contact_phone || sos.campaign.safety_notes ? (
          <div className={cardClass}>
            <h2 className="font-display-6 font-semibold text-button-accent mb-3">
              {t('Contacts and safety')}
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              {sos.reporter || sos.phone ? (
                <InfoRow label={t('Reporter')}>
                  {sos.reporter?.name ?? '—'}
                  {sos.phone ? (
                    <a href={`tel:${sos.phone}`} className="ml-2 inline-flex items-center gap-1 text-button-accent underline">
                      <TbPhone className="size-4" aria-hidden />
                      {sos.phone}
                    </a>
                  ) : null}
                </InfoRow>
              ) : null}
              {sos.campaign.contact_phone ? (
                <InfoRow label={t('Campaign contact')}>
                  {sos.campaign.contact_name ?? ''}
                  <a
                    href={`tel:${sos.campaign.contact_phone}`}
                    className="ml-2 inline-flex items-center gap-1 text-button-accent underline"
                  >
                    <TbPhone className="size-4" aria-hidden />
                    {sos.campaign.contact_phone}
                  </a>
                </InfoRow>
              ) : null}
              {sos.campaign.safety_notes ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                  <TbShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <div>
                    <p className="font-medium">{t('Safety notes of the campaign')}</p>
                    <p className="whitespace-pre-line">{sos.campaign.safety_notes}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Responders (reporter and team only) */}
        {sos.responders.length > 0 ? (
          <div className={cardClass}>
            <h2 className="font-display-6 font-semibold text-button-accent mb-2">{t('People helping')}</h2>
            <AvatarList
              isLoading={false}
              items={sos.responders.map((r) => ({ id: r.user_id, name: r.name, avatar: r.avatar }))}
              renderBadge={(item) => {
                const r = sos.responders.find((x) => x.user_id === item.id);
                if (!r) return null;
                return r.status === 'arrived' ? (
                  <Pill tone="green">{t('Arrived')}</Pill>
                ) : r.status === 'on_the_way' ? (
                  <Pill tone="blue">{t('On the way')}</Pill>
                ) : (
                  <Pill tone="neutral">{t('Cancelled')}</Pill>
                );
              }}
            />
          </div>
        ) : null}

        {/* Team actions */}
        {open && (perms.can_claim || perms.can_resolve || sos.claimed_at) ? (
          <div className={cn(cardClass, 'flex flex-wrap items-center justify-between gap-3')}>
            <p className="flex items-center gap-1.5 text-sm text-foreground-secondary">
              <TbClock className="size-4" aria-hidden />
              {sos.claimed_at
                ? t('Being handled since {{time}}', { time: format(new Date(sos.claimed_at), 'HH:mm') })
                : t('Nobody has taken charge yet')}
            </p>
            <div className="flex flex-wrap gap-2">
              {perms.can_claim && !sos.claimed_at ? (
                <Button
                  type="button"
                  variant="outlined-brown"
                  size="medium"
                  isLoading={claim.isPending}
                  onClick={run(() => claim.mutateAsync(sos.id))}
                >
                  {t('Take charge')}
                </Button>
              ) : null}
              {perms.can_resolve ? (
                <Button
                  type="button"
                  variant="green"
                  size="medium"
                  iconLeft={<TbCircleCheck className="size-5" aria-hidden />}
                  onClick={() => setResolveOpen(true)}
                >
                  {t('Resolved')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <ResolveSosDialog
        sosId={sos.id}
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        onResolved={setDetail}
      />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <span className="text-foreground-tertiary">{label}:</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function DetailsCard({ sos }: { sos: ISosDetail }) {
  const { t } = useTranslation();
  const d = sos.details;
  const rows: { label: string; value: ReactNode }[] = [];
  if (d) {
    if (sos.type === 'manpower') {
      if (d.people_needed) rows.push({ label: t('Extra people needed'), value: d.people_needed });
      if (d.tools?.length) {
        rows.push({
          label: t('Tools needed'),
          value: d.tools.map((x) => t(labelOf(SOS_TOOLS, x) ?? x)).join(', '),
        });
      }
      if (d.tools_note) rows.push({ label: t('Tools note'), value: d.tools_note });
    } else if (sos.type === 'hazard' && d.hazard_kind) {
      rows.push({
        label: t('Kind of hazardous waste'),
        value: t(labelOf(SOS_HAZARD_KINDS, d.hazard_kind) ?? d.hazard_kind),
      });
    } else if (sos.type === 'medical') {
      if (d.consciousness) {
        rows.push({
          label: t('Condition'),
          value: t(labelOf(SOS_CONSCIOUSNESS, d.consciousness) ?? d.consciousness),
        });
      }
      if (d.affected) rows.push({ label: t('People affected'), value: d.affected });
    }
  }
  if (sos.type === 'manpower' && sos.expires_at && isSosOpen(sos.state)) {
    rows.push({ label: t('Expires at'), value: format(new Date(sos.expires_at), 'HH:mm, dd/MM') });
  }

  if (rows.length === 0 && !sos.description && sos.photo_urls.length === 0) return null;

  return (
    <div className={cardClass}>
      <h2 className="font-display-6 font-semibold text-button-accent mb-3">{t('Details')}</h2>
      <div className="flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label}>
            {r.value}
          </InfoRow>
        ))}
        {sos.description ? <p className="whitespace-pre-line">{sos.description}</p> : null}
        {sos.photo_urls.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <AntdImage.PreviewGroup>
              {sos.photo_urls.map((url) => (
                <AntdImage
                  key={url}
                  src={url}
                  width={96}
                  height={96}
                  className="rounded-lg object-cover"
                  alt=""
                />
              ))}
            </AntdImage.PreviewGroup>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ClosedNotice({ sos }: { sos: ISosDetail }) {
  const { t } = useTranslation();
  if (sos.state === 'expired') {
    return (
      <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        {t('This SOS has expired.')}
      </p>
    );
  }
  if (sos.state !== 'resolved') return null;
  const code = labelOf(SOS_RESOLUTION_CODES, sos.resolution_code);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p className="font-medium">
        {sos.resolved_at
          ? t('Resolved at {{time}}', { time: format(new Date(sos.resolved_at), 'HH:mm, dd/MM/yyyy') })
          : t('Resolved')}
        {code ? ` · ${t(code)}` : ''}
      </p>
      {sos.resolution_note ? <p className="mt-1 whitespace-pre-line">{sos.resolution_note}</p> : null}
    </div>
  );
}

export default function SosDetailPage() {
  const { id = '' } = useParams() as { id?: string };
  return <SosDetailBody sosId={Number.parseInt(id, 10)} />;
}
