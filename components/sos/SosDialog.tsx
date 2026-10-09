import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  TbAlertTriangle,
  TbArrowLeft,
  TbCurrentLocation,
  TbMapPin,
  TbPhoto,
  TbX,
} from 'react-icons/tb';

import { useCreateSos } from '@/apis/sos/createSos';
import { useSosDuplicates } from '@/apis/sos/getSosDuplicates';
import { useSosEligibility } from '@/apis/sos/getSosEligibility';
import type { ICreateSosRequest, ISosDetails, SosType } from '@/apis/sos/models/sos';
import { uploadToCloudinary } from '@/libs/cloudinary';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  SOS_CONSCIOUSNESS,
  SOS_HAZARD_KINDS,
  SOS_INELIGIBLE_REASON,
  SOS_MAX_PEOPLE,
  SOS_MAX_PHOTOS,
  SOS_ROLE_LABEL,
  SOS_TOOLS,
  SOS_TYPE_META,
  SOS_TYPES,
} from '@/constants/sos';
import { useGeoPosition } from '@/hooks/useGeoPosition';
import { compressImage } from '@/libs/compressImage';
import { Link, useRouter } from '@/libs/router';
import { cn } from '@/libs/utils';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import { Call115Banner } from './Call115Banner';
import { SosTypeBadge } from './SosTypeBadge';

export interface SosCampaignOption {
  id: string;
  title: string;
}

export interface SosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The campaign the SOS belongs to; when missing the dialog asks for one (map). */
  campaignId?: string;
  /** Shift pre-selected (shift screen). */
  shiftId?: string;
  /** Running campaigns to choose from when `campaignId` is missing. */
  campaignOptions?: SosCampaignOption[];
}

interface SosFormValues {
  shift_id: string;
  people_needed: string;
  tools: string[];
  tools_note: string;
  hazard_kinds: string[];
  consciousness: string;
  affected: string;
  description: string;
}

const DEFAULT_VALUES: SosFormValues = {
  shift_id: '',
  people_needed: '',
  tools: [],
  tools_note: '',
  hazard_kinds: [],
  consciousness: '',
  affected: '1',
  description: '',
};

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

const chipClass = (active: boolean) =>
  cn(
    'rounded-full border px-3 py-1.5 text-sm transition',
    active
      ? 'border-button-accent bg-button-accent text-white'
      : 'border-[rgba(136,122,71,0.4)] bg-white text-foreground-secondary hover:bg-background-primary',
  );

/** Spec "Phân loại SOS": step 1 picks the type, step 2 its details, photos, shift and location. */
export function SosDialog(props: SosDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {props.open ? <SosDialogBody {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function SosDialogBody({ onOpenChange, campaignId, shiftId, campaignOptions }: SosDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId ?? '');
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<SosType | null>(null);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geo = useGeoPosition({ requestOnMount: true });
  const position = geo.position;
  const gpsSettled = geo.status === 'ready' || geo.status === 'unavailable';

  const eligibilityParams = useMemo(
    () => ({
      campaign_id: selectedCampaign,
      ...(position ? { latitude: position.lat, longitude: position.lng } : {}),
    }),
    [selectedCampaign, position],
  );
  const eligibilityQuery = useSosEligibility(eligibilityParams, {
    enabled: Boolean(selectedCampaign) && gpsSettled,
  });
  const eligibility = eligibilityQuery.data?.data;
  const shifts = useMemo(() => eligibility?.shifts ?? [], [eligibility?.shifts]);
  const canRaise = Boolean(eligibility?.can_raise);

  const form = useForm<SosFormValues>({ defaultValues: DEFAULT_VALUES });
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Pre-select the shift of the screen, or the only one.
  useEffect(() => {
    if (!shifts.length) return;
    const current = form.getValues('shift_id');
    if (current && shifts.some((s) => s.id === current)) return;
    const preferred = shifts.find((s) => s.id === shiftId) ?? shifts[0];
    setValue('shift_id', preferred.id);
  }, [shifts, shiftId, form, setValue]);

  // Free the preview URLs.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    [],
  );

  const duplicatesQuery = useSosDuplicates(
    {
      campaign_id: selectedCampaign,
      type: type ?? 'manpower',
      latitude: position?.lat ?? 0,
      longitude: position?.lng ?? 0,
    },
    { enabled: step === 2 && Boolean(type && position && selectedCampaign) },
  );
  const duplicates = duplicatesQuery.data?.data ?? [];

  const createMutation = useCreateSos({
    onSuccess: (res) => {
      onOpenChange(false);
      if (res.data?.id != null) router.push(`/sos/${res.data.id}`);
    },
  });
  const isBusy = uploading || createMutation.isPending;

  const tools = watch('tools');
  const shiftIdValue = watch('shift_id');
  const selectedShift = shifts.find((s) => s.id === shiftIdValue);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const room = SOS_MAX_PHOTOS - photos.length;
    if (images.length > room) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: t('You can add up to {{n}} photos', { n: SOS_MAX_PHOTOS }),
      });
    }
    const next = images.slice(0, Math.max(0, room)).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    if (next.length) setPhotoError(null);
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const pickType = (value: SosType) => {
    setType(value);
    setStep(2);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!type || !selectedCampaign) return;
    let details: ISosDetails;
    if (type === 'manpower') {
      const people = values.people_needed.trim() ? Number.parseInt(values.people_needed, 10) : null;
      if (people == null && values.tools.length === 0) {
        form.setError('people_needed', {
          message: t('Give the number of people needed or pick at least one tool'),
        });
        return;
      }
      details = {
        ...(people != null ? { people_needed: people } : {}),
        ...(values.tools.length
          ? { tools: values.tools as ISosDetails['tools'], tools_note: values.tools_note.trim() || null }
          : {}),
      };
    } else if (type === 'hazard') {
      if (photos.length === 0) {
        setPhotoError(t('Add at least one photo taken from a safe distance'));
        return;
      }
      details = { hazard_kinds: values.hazard_kinds as ISosDetails['hazard_kinds'] };
    } else {
      details = {
        consciousness: values.consciousness as ISosDetails['consciousness'],
        affected: Number.parseInt(values.affected, 10),
      };
    }

    let photoUrls: string[] = [];
    if (photos.length) {
      setUploading(true);
      try {
        photoUrls = await Promise.all(
          photos.map(async (p) => uploadToCloudinary(await compressImage(p.file))),
        );
      } catch {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t('Could not upload the photos. Please try again.'),
        });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: ICreateSosRequest = {
      campaign_id: selectedCampaign,
      type,
      details,
      ...(values.shift_id ? { shift_id: values.shift_id } : {}),
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
      ...(photoUrls.length ? { photo_urls: photoUrls } : {}),
      ...(position
        ? {
            latitude: position.lat,
            longitude: position.lng,
            ...(position.accuracy != null ? { accuracy: Math.round(position.accuracy) } : {}),
          }
        : {}),
    };
    try {
      await createMutation.mutateAsync(payload);
    } catch {
      // usePost surfaces API errors.
    }
  });

  const typeMeta = type ? SOS_TYPE_META[type] : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full p-1 text-foreground-secondary hover:bg-background-primary"
              aria-label={t('Back')}
            >
              <TbArrowLeft className="size-5" />
            </button>
          ) : null}
          {t('Send an SOS')}
        </DialogTitle>
        <DialogDescription>
          {step === 1
            ? t('Choose what kind of help is needed.')
            : t('Fill in the details so the right people can help.')}
        </DialogDescription>
      </DialogHeader>

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          {!campaignId ? (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Campaign')} <span className="text-destructive">*</span>
              </FieldLabel>
              {campaignOptions && campaignOptions.length > 0 ? (
                <Select value={selectedCampaign || undefined} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className={cn('w-full', inputClassName)}>
                    <SelectValue placeholder={t('Select a running campaign...')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {campaignOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="text-sm">{c.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground-tertiary">
                  {t('No campaign is running right now.')}
                </p>
              )}
            </Field>
          ) : null}

          <EligibilityNotice
            hasCampaign={Boolean(selectedCampaign)}
            loading={!gpsSettled || eligibilityQuery.isLoading}
            isError={eligibilityQuery.isError}
            canRaise={canRaise}
            reason={eligibility?.reason ?? null}
            role={eligibility?.role ?? null}
            onRetryLocation={() => void geo.request()}
          />

          <div className="grid gap-3">
            {SOS_TYPES.map((value) => {
              const meta = SOS_TYPE_META[value];
              const Icon = meta.icon;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!canRaise}
                  onClick={() => pickType(value)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
                    meta.borderClass,
                    meta.bgClass,
                    'hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-full bg-white',
                      meta.textClass,
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className={cn('font-semibold', meta.textClass)}>{t(meta.label)}</span>
                    <span className="text-xs text-foreground-secondary">{t(meta.hint)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {type && typeMeta ? (
            <div className="flex items-center justify-between gap-2">
              <SosTypeBadge type={type} />
              <button
                type="button"
                className="text-xs text-button-accent underline"
                onClick={() => setStep(1)}
              >
                {t('Change type')}
              </button>
            </div>
          ) : null}

          {type === 'medical' ? <Call115Banner /> : null}
          {type === 'hazard' ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <TbAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('Do not touch it, keep your distance and wait for the authorities.')}
            </p>
          ) : null}

          {duplicates.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-medium">
                {t('An open SOS of the same type already exists within 200 m. Open it instead?')}
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/sos/${d.id}`}
                      className="text-button-accent underline"
                      onClick={() => onOpenChange(false)}
                    >
                      {t('SOS #{{id}} · sent at {{time}}', {
                        id: d.id,
                        time: format(new Date(d.created_at), 'HH:mm'),
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs">{t('You can still send a new one.')}</p>
            </div>
          ) : null}

          {/* Type fields */}
          {type === 'manpower' ? (
            <>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Extra people needed')}
                  <InfoTooltip content={t('Give a number of people, tools, or both.')} />
                </FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={SOS_MAX_PEOPLE}
                  inputMode="numeric"
                  placeholder={t('1 – 20')}
                  className={inputClassName}
                  aria-invalid={!!errors.people_needed}
                  {...register('people_needed', {
                    validate: (v) => {
                      if (!v.trim()) return true;
                      const n = Number(v);
                      return (
                        (Number.isInteger(n) && n >= 1 && n <= SOS_MAX_PEOPLE) ||
                        t('Enter a number from 1 to 20')
                      );
                    },
                  })}
                />
                <FieldError errors={[errors.people_needed]} />
              </Field>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Tools needed')}
                </FieldLabel>
                <Controller
                  name="tools"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {SOS_TOOLS.map((tool) => {
                        const active = field.value.includes(tool.value);
                        return (
                          <button
                            key={tool.value}
                            type="button"
                            aria-pressed={active}
                            className={chipClass(active)}
                            onClick={() => {
                              form.clearErrors('people_needed');
                              field.onChange(
                                active
                                  ? field.value.filter((v) => v !== tool.value)
                                  : [...field.value, tool.value],
                              );
                            }}
                          >
                            {t(tool.label)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </Field>
              {tools.length > 0 ? (
                <Field>
                  <FieldLabel className="text-foreground-tertiary font-display-3">
                    {t('Tools note')}
                    {tools.includes('other') ? <span className="text-destructive">*</span> : null}
                  </FieldLabel>
                  <Input
                    placeholder={t('e.g. 2 trucks, 50 large bags')}
                    className={inputClassName}
                    maxLength={500}
                    aria-invalid={!!errors.tools_note}
                    {...register('tools_note', {
                      validate: (v) =>
                        !tools.includes('other') ||
                        Boolean(v.trim()) ||
                        t('Say which other tools are needed'),
                    })}
                  />
                  <FieldError errors={[errors.tools_note]} />
                </Field>
              ) : null}
            </>
          ) : null}

          {type === 'hazard' ? (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Kind of hazardous waste')} <span className="text-destructive">*</span>
                <InfoTooltip content={t('Choose one or more')} />
              </FieldLabel>
              <Controller
                name="hazard_kinds"
                control={control}
                rules={{ validate: (v) => v.length > 0 || t('Choose the kind of hazardous waste') }}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {SOS_HAZARD_KINDS.map((kind) => {
                      const active = field.value.includes(kind.value);
                      return (
                        <button
                          key={kind.value}
                          type="button"
                          aria-pressed={active}
                          className={chipClass(active)}
                          onClick={() =>
                            field.onChange(
                              active ? field.value.filter((v) => v !== kind.value) : [...field.value, kind.value],
                            )
                          }
                        >
                          {t(kind.label)}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <FieldError errors={[errors.hazard_kinds]} />
            </Field>
          ) : null}

          {type === 'medical' ? (
            <>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Condition')} <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  name="consciousness"
                  control={control}
                  rules={{ required: t('Choose the condition') }}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {SOS_CONSCIOUSNESS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          aria-pressed={field.value === c.value}
                          className={chipClass(field.value === c.value)}
                          onClick={() => field.onChange(c.value)}
                        >
                          {t(c.label)}
                        </button>
                      ))}
                    </div>
                  )}
                />
                <FieldError errors={[errors.consciousness]} />
              </Field>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('People affected')} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={inputClassName}
                  aria-invalid={!!errors.affected}
                  {...register('affected', {
                    required: t('Enter how many people are affected'),
                    validate: (v) => {
                      const n = Number(v);
                      return (Number.isInteger(n) && n >= 1) || t('Enter a whole number of at least 1');
                    },
                  })}
                />
                <FieldError errors={[errors.affected]} />
              </Field>
            </>
          ) : null}

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Short description')}
            </FieldLabel>
            <Textarea
              rows={3}
              maxLength={2000}
              placeholder={t('What is happening? (optional)')}
              className={inputClassName}
              {...register('description')}
            />
          </Field>

          {/* Photos */}
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Photos')}
              {type === 'hazard' ? <span className="text-destructive">*</span> : null}
              {type === 'hazard' ? (
                <InfoTooltip content={t('Take photos from a safe distance.')} />
              ) : null}
            </FieldLabel>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={p.preview} className="relative size-20">
                  <img src={p.preview} alt="" className="size-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200"
                    aria-label={t('Remove')}
                  >
                    <TbX className="size-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < SOS_MAX_PHOTOS ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-1 border-dashed border-button-accent-hover text-xs text-button-accent"
                >
                  <TbPhoto className="size-5" aria-hidden />
                  {t('Add photo')}
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                hidden
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {photoError ? <span className="text-red-500 text-sm mt-1">{photoError}</span> : null}
          </Field>

          {/* Shift */}
          {shifts.length > 0 ? (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">{t('Shift')}</FieldLabel>
              {eligibility?.role === 'manager' && shifts.length > 1 ? (
                <Controller
                  name="shift_id"
                  control={control}
                  rules={{ required: t('Choose a shift') }}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className={cn('w-full', inputClassName)}>
                        <SelectValue placeholder={t('Choose a shift')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {shifts.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="text-sm">
                              {s.meeting_point_name || s.name} · {format(new Date(s.start_at), 'HH:mm')}–
                              {format(new Date(s.end_at), 'HH:mm')}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : selectedShift ? (
                <p className="text-sm text-foreground-secondary">
                  {selectedShift.meeting_point_name || selectedShift.name} ·{' '}
                  {format(new Date(selectedShift.start_at), 'HH:mm')}–
                  {format(new Date(selectedShift.end_at), 'HH:mm')}
                </p>
              ) : null}
              <FieldError errors={[errors.shift_id]} />
            </Field>
          ) : null}

          {/* Location */}
          <div className="flex items-start gap-2 rounded-lg bg-background-primary px-3 py-2 text-sm text-foreground-secondary">
            {position ? (
              <>
                <TbCurrentLocation className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>
                  {position.accuracy != null
                    ? t('Your GPS location is used (± {{m}} m).', { m: Math.round(position.accuracy) })
                    : t('Your GPS location is used.')}
                </span>
              </>
            ) : (
              <>
                <TbMapPin className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                <span className="flex-1">
                  {geo.status === 'pending'
                    ? t('Getting your location…')
                    : t('GPS is not available; the meeting point of the shift will be used.')}
                </span>
                {geo.status === 'unavailable' ? (
                  <button
                    type="button"
                    className="text-xs text-button-accent underline"
                    onClick={() => void geo.request()}
                  >
                    {t('Try again')}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isBusy || !canRaise}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {uploading
                ? t('Uploading photos…')
                : createMutation.isPending
                  ? t('Sending...')
                  : t('Send SOS')}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}

function EligibilityNotice({
  hasCampaign,
  loading,
  isError,
  canRaise,
  reason,
  role,
  onRetryLocation,
}: {
  hasCampaign: boolean;
  loading: boolean;
  isError: boolean;
  canRaise: boolean;
  reason: keyof typeof SOS_INELIGIBLE_REASON | null;
  role: keyof typeof SOS_ROLE_LABEL | null;
  onRetryLocation: () => void;
}) {
  const { t } = useTranslation();
  if (!hasCampaign) return null;
  if (loading) return <Skeleton className="h-10 w-full rounded-lg" />;
  if (isError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
        {t('Could not check whether you can send an SOS. Please try again.')}
      </p>
    );
  }
  if (!canRaise) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
        <p>{reason ? t(SOS_INELIGIBLE_REASON[reason]) : t('You cannot send an SOS for this campaign.')}</p>
        {reason === 'location_required' || reason === 'too_far' ? (
          <button type="button" className="mt-1 text-xs underline" onClick={onRetryLocation}>
            {t('Check my location again')}
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <></>
    // <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
    //   {role ? t('Sending as: {{role}}', { role: t(SOS_ROLE_LABEL[role]) }) : null}
    // </p>
  );
}

export default SosDialog;
