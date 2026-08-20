'use client';

import Image from '@/components/ui/AppImage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FaTrashCan } from 'react-icons/fa6';
import { IoIosImages } from 'react-icons/io';
import { toast } from 'sonner';

import useAuthStore from '@/stores/useAuthStore';
import { updateUser } from '@/apis/user/updateUser';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/client/shared/DropdownMenu';
import defaultAvatar from '@/public/default-avatar.png';
import { Button } from '@/components/client/shared/Button';
import { Button as UIButton } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/libs/utils';

type GenderValue = 'male' | 'female' | 'other' | 'prefer_not_to_say';

type ProfileFormValues = {
  name: string;
  email: string;
  avatar: string | null;
  phone_number: string;
  gender: GenderValue | '';
  date_of_birth: string;
};

const GENDER_OPTIONS: { value: GenderValue; labelKey: string }[] = [
  { value: 'male', labelKey: 'Male' },
  { value: 'female', labelKey: 'Female' },
  { value: 'other', labelKey: 'Other' },
  { value: 'prefer_not_to_say', labelKey: 'Prefer not to say' },
];

/** Optional phone: digits with optional +, spaces, dashes, parentheses (7–20 chars). */
const PHONE_RE = /^[0-9+\s\-().]{7,20}$/;

const isValidPhoneNumber = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PHONE_RE.test(trimmed);
};

const formatDateToApi = (date?: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseApiDate = (date?: string | null): Date | undefined => {
  if (!date) return undefined;
  const isoDay = date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return undefined;
  const parsed = new Date(`${isoDay}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

function valuesFromUser(user: {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  phone_number?: string | null;
  gender?: GenderValue | null;
  date_of_birth?: string | null;
} | null | undefined): ProfileFormValues {
  const dob = user?.date_of_birth ? user.date_of_birth.slice(0, 10) : '';
  return {
    name: (user?.name ?? '').trim(),
    email: (user?.email ?? '').trim(),
    avatar: user?.avatar ?? null,
    phone_number: (user?.phone_number ?? '').trim(),
    gender: (user?.gender as GenderValue | null | undefined) ?? '',
    date_of_birth: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : '',
  };
}

export function ProfileGeneralInformation() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    defaultValues: valuesFromUser(user),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const avatarActionsDisabled = !isEditing || avatarUploading || saving;

  useEffect(() => {
    if (!isEditing) {
      reset(valuesFromUser(user));
    }
  }, [user, isEditing, reset]);

  useEffect(() => {
    if (avatarActionsDisabled) {
      setAvatarMenuOpen(false);
    }
  }, [avatarActionsDisabled]);

  const inputClassName = useMemo(
    () =>
      'border border-[rgba(136,122,71,0.35)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.35)]/50',
    [],
  );

  const avatarSrc = watch('avatar') || defaultAvatar;
  const dateOfBirthValue = watch('date_of_birth');

  const handlePickAvatar = () => fileRef.current?.click();
  const handleRemoveAvatar = () => {
    setValue('avatar', null, { shouldDirty: true });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('Please choose an image file.'));
      return;
    }

    setAvatarUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setValue('avatar', url, { shouldDirty: true });
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to upload image'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const onCancel = () => {
    reset(valuesFromUser(user));
    setIsDobOpen(false);
    setIsEditing(false);
  };

  const onSave = handleSubmit(async (values) => {
    if (!user?.id) {
      toast.error(t('Please login again.'));
      return;
    }

    setSaving(true);
    try {
      const res = await updateUser(user.id, {
        name: values.name.trim(),
        avatar: values.avatar === null ? null : values.avatar || undefined,
        phone_number: values.phone_number.trim() || null,
        gender: values.gender || null,
        date_of_birth: values.date_of_birth || null,
      });
      const nextUser = res?.data?.user;
      if (nextUser) setUser(nextUser);
      toast.success(t('Updated successfully'));
      setIsDobOpen(false);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to update profile'));
    } finally {
      setSaving(false);
    }
  });

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-button-accent">{t('Account')}</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            {t('Manage your profile and session')}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outlined-brown"
                
                onClick={onCancel}
                disabled={saving || avatarUploading}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="button"
                variant="brown"
                
                onClick={() => void onSave()}
                isLoading={saving}
                disabled={saving || avatarUploading}
              >
                {t('Save')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="brown"
              
              onClick={() => setIsEditing(true)}
            >
              {t('Edit')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel className="text-xs text-foreground-secondary">{t('Avatar')}</FieldLabel>
          <div className="mt-1 flex items-center gap-4">
            <div className="relative h-25 w-25 overflow-hidden rounded-full border border-[rgba(136,122,71,0.35)] bg-white">
              <Image src={avatarSrc} alt={t('Avatar')} fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={avatarActionsDisabled}
              />
              <DropdownMenu
                open={avatarMenuOpen}
                onOpenChange={(open) => {
                  if (avatarActionsDisabled) {
                    setAvatarMenuOpen(false);
                    return;
                  }
                  setAvatarMenuOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outlined-brown"
                    isDisabled={avatarActionsDisabled}
                  >
                    {avatarUploading ? t('Uploading...') : t('Change avatar')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    disabled={avatarActionsDisabled}
                    onClick={handlePickAvatar}
                  >
                    <IoIosImages className="size-4" />
                    {t('Choose from library')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer text-xs"
                    disabled={avatarActionsDisabled}
                    onClick={handleRemoveAvatar}
                  >
                    <FaTrashCan className="size-4" />
                    {t('Remove')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Field>

          <Field>
            <FieldLabel className="text-xs text-foreground-secondary">{t('Name')}</FieldLabel>
            <Input
              {...register('name', {
                required: t('Name is required'),
                validate: (v) => v.trim().length > 0 || t('Name is required'),
              })}
              placeholder={t('Enter your name...')}
              className={inputClassName}
              disabled={!isEditing || saving}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field>
            <FieldLabel className="text-xs text-foreground-secondary">{t('Email')}</FieldLabel>
            <Input {...register('email')} className={inputClassName} disabled />
          </Field>

          <Field>
            <FieldLabel className="text-xs text-foreground-secondary">{t('Phone number')}</FieldLabel>
            <Input
              type="tel"
              {...register('phone_number', {
                maxLength: {
                  value: 20,
                  message: t('Phone number must be at most 20 characters'),
                },
                validate: (value) =>
                  isValidPhoneNumber(value) || t('Invalid phone number'),
              })}
              placeholder={t('e.g. +84 901 234 567')}
              className={inputClassName}
              disabled={!isEditing || saving}
            />
            <FieldError errors={[errors.phone_number]} />
          </Field>

          <Field>
            <FieldLabel className="text-xs text-foreground-secondary">{t('Gender')}</FieldLabel>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => field.onChange(value as GenderValue)}
                  disabled={!isEditing || saving}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full border border-[rgba(136,122,71,0.35)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.35)]/50',
                    )}
                  >
                    <SelectValue placeholder={t('Select gender...')} />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.gender]} />
          </Field>

          <Field>
            <FieldLabel className="text-xs text-foreground-secondary">{t('Date of birth')}</FieldLabel>
            <Controller
              name="date_of_birth"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <UIButton
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-[rgba(136,122,71,0.35)] hover:bg-transparent !h-[50px]',
                      !field.value && 'text-muted-foreground',
                    )}
                    onClick={() => {
                      if (!isEditing || saving) return;
                      setIsDobOpen((prev) => !prev);
                    }}
                    disabled={!isEditing || saving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(parseApiDate(field.value) as Date, 'PPP')
                    ) : (
                      <span>{t('Pick a date')}</span>
                    )}
                  </UIButton>
                  {isDobOpen && isEditing && (
                    <div className="absolute z-50 mt-2 rounded-md border border-[rgba(136,122,71,0.35)] bg-background shadow-md">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        startMonth={new Date(1920, 0)}
                        endMonth={new Date()}
                        defaultMonth={parseApiDate(dateOfBirthValue) ?? new Date(2000, 0, 1)}
                        selected={parseApiDate(field.value)}
                        onSelect={(date) => {
                          field.onChange(formatDateToApi(date));
                          setIsDobOpen(false);
                        }}
                        disabled={{ after: new Date() }}
                      />
                    </div>
                  )}
                </div>
              )}
            />
            <FieldError errors={[errors.date_of_birth]} />
          </Field>
      </div>
    </section>
  );
}
