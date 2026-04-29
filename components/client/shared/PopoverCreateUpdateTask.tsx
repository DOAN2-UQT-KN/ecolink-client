'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Image as AntdImage } from 'antd';
import { toast } from 'sonner';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { IoDocumentAttachOutline } from 'react-icons/io5';
import { BiTrash, BiPlus } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/client/shared/Button';
import { Button as UIButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCampaignTask, useUpdateCampaignTask } from '@/apis/campaign/campaignTask';
import { ICampaignTask } from '@/apis/campaign/models/campaignTask';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/libs/utils';
import { Calendar } from '@/components/ui/calendar';
import SelectListPriority from '@/components/form/SelectListPriority';
import { PRIORITY } from '@/constants/priority';
import { STATUS } from '@/constants/status';
import { parseScheduledTimeRange } from '@/utils/scheduledTimeRange';
import { compressImage } from '@/libs/compressImage';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { uploadMultipleImages } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';

export interface PopoverCreateUpdateTaskProps {
  open: boolean;
  onClose: () => void;
  task?: ICampaignTask;
  campaignId: string;
  onSuccess: () => void;
}

type TaskFormValues = {
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time_from: string;
  scheduled_time_to: string;
  priority: number;
  result_description: string;
  result_images: (string | Blob)[];
  status?: number;
};

function hasMeaningfulRichTextContent(value?: string): boolean {
  if (!value) return false;
  const plainText = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return plainText.length > 0;
}

const ImagePreviewItem = memo(function ImagePreviewItem({
  image,
  index,
  onRemove,
}: {
  image: string | Blob;
  index: number;
  onRemove: (index: number) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let url = '';
    if (typeof image === 'string') {
      url = image;
    } else {
      url = URL.createObjectURL(image);
    }
    setPreviewUrl(url);

    return () => {
      if (typeof image !== 'string' && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [image]);

  if (!previewUrl) {
    return (
      <div className="w-[120px] h-[120px] rounded-xl bg-slate-100 animate-pulse border border-[rgba(136,122,71,0.5)]" />
    );
  }

  return (
    <div className="relative w-[120px] h-[120px] rounded-xl group shadow-sm ring-1 ring-black/5">
      <AntdImage
        src={previewUrl}
        alt={`Uploaded ${index}`}
        width={120}
        height={120}
        className="object-cover transition-transform duration-300 w-full h-full rounded-xl"
        preview={{
          cover: (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <FaEye size={24} />
            </div>
          ),
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute -top-2 -right-2 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
      >
        <BiTrash size={16} />
      </button>
    </div>
  );
});

const CreateUpdateTaskFormBody = memo(function CreateUpdateTaskFormBody({
  task,
  campaignId,
  onClose,
  onSuccess,
}: Omit<PopoverCreateUpdateTaskProps, 'open'>) {
  const { t } = useTranslation();
  const isCreate = !task;
  const isInProgressTask = !isCreate && task?.status === STATUS.IN_PROGRESS;

  const defaultValues = useMemo((): TaskFormValues => {
    let initialDate = '';
    const initialTimeRange = parseScheduledTimeRange(task?.scheduled_time);

    if (task?.scheduled_date) {
      initialDate = new Date(task.scheduled_date).toISOString().substring(0, 16);
    } else if (task?.scheduled_time && task.scheduled_time.includes('T')) {
      initialDate = new Date(task.scheduled_time).toISOString().substring(0, 16);
    }

    return {
      title: task?.title || '',
      description: task?.description || '',
      scheduled_date: initialDate,
      scheduled_time_from: initialTimeRange.scheduled_time_from,
      scheduled_time_to: initialTimeRange.scheduled_time_to,
      priority: task?.priority ?? PRIORITY.MEDIUM,
      result_description: task?.result?.description || '',
      result_images: task?.result?.file || [],
      status: task?.status ?? 1,
    };
  }, [task]);

  const form = useForm<TaskFormValues>({
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const { mutateAsync: createMutate, isPending: isCreating } = useCreateCampaignTask({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateCampaignTask({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [compressingResultImages, setCompressingResultImages] = useState(false);
  const [uploadingResultImages, setUploadingResultImages] = useState(false);
  const resultImageInputRef = useRef<HTMLInputElement>(null);

  const busy = isCreating || isUpdating || uploadingResultImages;
  const resultImages = form.watch('result_images') || [];
  const watchedStatus = form.watch('status');
  const watchedResultDescription = form.watch('result_description');

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );
  const statusOptions = useMemo(
    () => [
      { value: STATUS.TODO, label: t('To do') },
      { value: STATUS.IN_PROGRESS, label: t('In progress') },
      { value: STATUS.COMPLETED, label: t('Completed') },
    ],
    [t],
  );

  const handleResultImagesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = 10 - resultImages.length;
      if (remainingSlots <= 0) {
        toast.error(t('Maximum 10 images allowed.'));
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast.warning(
          t('Only {{count}} images were added because of the limit.', {
            count: remainingSlots,
          }),
        );
      }

      setCompressingResultImages(true);

      try {
        const newImages = await Promise.all(filesToProcess.map((file) => compressImage(file)));
        form.setValue('result_images', [...resultImages, ...newImages], { shouldDirty: true });
      } catch (error) {
        console.error('Error compressing files:', error);
        toast.error(t('Failed to compress some images.'));
      } finally {
        setCompressingResultImages(false);
        e.target.value = '';
      }
    },
    [form, resultImages, t],
  );

  const removeResultImage = useCallback(
    (index: number) => {
      const updatedImages = resultImages.filter((_, i) => i !== index);
      form.setValue('result_images', updatedImages, { shouldDirty: true });
    },
    [form, resultImages],
  );

  const clearAllResultImages = useCallback(() => {
    form.setValue('result_images', [], { shouldDirty: true });
  }, [form]);

  useEffect(() => {
    const isCompletedStatus = Number(watchedStatus) === STATUS.COMPLETED;
    const hasResultDescription = hasMeaningfulRichTextContent(watchedResultDescription);
    const hasResultImages = (resultImages?.length ?? 0) > 0;

    if (!isCompletedStatus || hasResultDescription || hasResultImages) {
      clearErrors('result_description');
    }
  }, [watchedStatus, watchedResultDescription, resultImages, clearErrors]);

  const onValidSubmit = useCallback(
    async (data: TaskFormValues) => {
      const scheduleTimeRange = `${data.scheduled_time_from}-${data.scheduled_time_to}`;

      if (isCreate) {
        await createMutate({
          campaignId,
          title: data.title.trim(),
          description: data.description.trim(),
          scheduled_date: new Date(data.scheduled_date).toISOString(),
          scheduled_time: scheduleTimeRange,
          priority: Number(data.priority),
        });
      } else {
        if (!task) return;
        const isCompletedStatus = Number(data.status) === STATUS.COMPLETED;
        const hasResultDescription = hasMeaningfulRichTextContent(data.result_description);
        const hasResultImages = (data.result_images?.length ?? 0) > 0;

        if (isCompletedStatus && !hasResultDescription && !hasResultImages) {
          setError('result_description', {
            type: 'manual',
            message: t('Result is required when status is Completed'),
          });
          return;
        }

        clearErrors('result_description');

        let resultImageUrls: string[] = [];
        try {
          setUploadingResultImages(true);
          resultImageUrls = await uploadMultipleImages(data.result_images);
        } catch (error) {
          console.error('Error uploading result images:', error);
          toast.error(t('Failed to upload some images.'));
          return;
        } finally {
          setUploadingResultImages(false);
        }

        await updateMutate({
          id: task.id,
          title: data.title.trim(),
          description: data.description.trim(),
          scheduled_date: new Date(data.scheduled_date).toISOString(),
          scheduled_time: scheduleTimeRange,
          priority: Number(data.priority),
          result: {
            description: data.result_description?.trim() || '',
            file: resultImageUrls,
          },
          status: Number(data.status),
        });
      }
    },
    [isCreate, createMutate, updateMutate, campaignId, t, task, setError, clearErrors],
  );
  return (
    <DialogContent
      className="sm:max-w-xl max-h-[min(90vh,720px)] overflow-y-auto gap-4 scrollbar-hide"
      showCloseButton
      onPointerDownOutside={(e) => {
        if (busy) e.preventDefault();
      }}
      onEscapeKeyDown={(e) => {
        if (busy) e.preventDefault();
      }}
    >
      <style>{`
        .react-time-picker-custom .react-time-picker__wrapper {
          border: none !important;
          background: transparent !important;
        }
        .react-time-picker-custom .react-time-picker__inputGroup__input {
          outline: none !important;
          background: transparent !important;
          font-size: 14px;
        }
        .react-time-picker-custom .react-time-picker__inputGroup__divider,
        .react-time-picker-custom .react-time-picker__inputGroup__leadingZero {
          color: inherit;
        }
      `}</style>
      <DialogHeader>
        <DialogTitle className="text-left font-semibold">
          {isCreate ? t('Create task') : t('Edit task')}
        </DialogTitle>
      </DialogHeader>
      <form
        className="flex flex-col gap-6 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onValidSubmit)(e);
        }}
      >
        <div className="flex flex-col gap-6">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Title')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...register('title', { required: t('Title is required') })}
              placeholder={t('Enter task title...')}
              className={inputClassName}
              disabled={busy || [STATUS.COMPLETED, STATUS.IN_PROGRESS].includes(task?.status || 0)}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          {!isCreate && (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Status')}
              </FieldLabel>
              <Controller
                control={form.control}
                name="status"
                rules={{ required: t('Status is required') }}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={busy}
                  >
                    <SelectTrigger className={cn('w-full', inputClassName)}>
                      <SelectValue placeholder={t('Select status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
          )}

          {!isInProgressTask && (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Description')}
              </FieldLabel>

              <RichTextEditor
                value={defaultValues.description}
                onChange={(value) => form.setValue('description', value)}
                placeholder={t('Enter description...')}
                className={cn(inputClassName, 'min-h-[220px]')}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          )}

          {!isInProgressTask && (
            <div className="flex flex-col sm:flex-row gap-6">
              <Field className="flex-1">
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Schedule Date')} <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="scheduled_date"
                  rules={{ required: t('Schedule date is required') }}
                  render={({ field }) => (
                    <div className="relative">
                      <UIButton
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal border-[rgba(136,122,71,0.5)] hover:bg-transparent !h-[50px] focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
                          !field.value && 'text-muted-foreground',
                        )}
                        onClick={() => setIsDatePickerOpen((prev) => !prev)}
                        disabled={busy}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(new Date(field.value), 'PPP')
                        ) : (
                          <span>{t('Pick a date')}</span>
                        )}
                      </UIButton>
                      {isDatePickerOpen && (
                        <div className="absolute z-50 mt-2 rounded-md border border-[rgba(136,122,71,0.5)] bg-background shadow-md">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? date.toISOString() : '');
                              setIsDatePickerOpen(false);
                            }}
                            disabled={busy}
                          />
                        </div>
                      )}
                    </div>
                  )}
                />
                <FieldError errors={[errors.scheduled_date]} />
              </Field>

              <Field className="flex-1">
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Scheduled Time')} <span className="text-destructive">*</span>
                </FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">{t('From')}</span>
                  <span className="text-xs text-muted-foreground">{t('To')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller
                    control={form.control}
                    name="scheduled_time_from"
                    rules={{ required: t('Start time is required') }}
                    render={({ field }) => (
                      <div
                        className={cn(
                          'flex items-center w-full px-3 bg-transparent rounded-md',
                          inputClassName,
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <TimePicker
                          onChange={field.onChange}
                          value={field.value}
                          disabled={busy}
                          format="HH:mm"
                          clearIcon={null}
                          clockIcon={null}
                          disableClock={true}
                          className="w-full h-[48px] react-time-picker-custom"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="scheduled_time_to"
                    rules={{
                      required: t('End time is required'),
                      validate: (value) => {
                        const fromTime = form.getValues('scheduled_time_from');
                        return (
                          !fromTime ||
                          value > fromTime ||
                          t('End time must be later than start time')
                        );
                      },
                    }}
                    render={({ field }) => (
                      <div
                        className={cn(
                          'flex items-center w-full px-3 bg-transparent rounded-md',
                          inputClassName,
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <TimePicker
                          onChange={field.onChange}
                          value={field.value}
                          disabled={busy}
                          format="HH:mm"
                          clearIcon={null}
                          clockIcon={null}
                          disableClock={true}
                          className="w-full h-[48px] react-time-picker-custom"
                        />
                      </div>
                    )}
                  />
                </div>

                {form.watch('scheduled_time_from') &&
                  form.watch('scheduled_time_to') &&
                  form.watch('scheduled_time_to') <= form.watch('scheduled_time_from') && (
                    <p className="text-sm text-destructive">
                      {t('End time must be later than start time')}
                    </p>
                  )}
                <FieldError errors={[errors.scheduled_time_from, errors.scheduled_time_to]} />
              </Field>
            </div>
          )}

          {!isInProgressTask && (
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t('Priority')}
              </FieldLabel>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <SelectListPriority
                    value={field.value}
                    onChange={field.onChange}
                    disabled={busy}
                    className={inputClassName}
                  />
                )}
              />
              <FieldError errors={[errors.priority]} />
            </Field>
          )}

          {!isCreate && (
            <>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Result')}
                </FieldLabel>

                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-sm text-foreground-tertiary">{t('Description')}</span>
                    <RichTextEditor
                      value={form.watch('result_description')}
                      onChange={(value) =>
                        form.setValue('result_description', value || '', { shouldDirty: true })
                      }
                      placeholder={t('Enter result description...')}
                      className={cn(inputClassName, 'min-h-[180px] mt-2')}
                    />
                    <FieldError errors={[errors.result_description]} />
                    {form.watch('status') === STATUS.COMPLETED &&
                      !hasMeaningfulRichTextContent(form.watch('result_description')) &&
                      resultImages.length === 0 && (
                        <p className="text-sm text-destructive">
                          {t('Result is required when status is Completed')}
                        </p>
                      )}
                  </div>

                  <div>
                    <span className="text-sm text-foreground-tertiary">{t('Upload Images')}</span>
                    <div className="mt-2 ">
                      <input
                        type="file"
                        ref={resultImageInputRef}
                        onChange={handleResultImagesChange}
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={busy || compressingResultImages}
                      />

                      {resultImages.length === 0 ? (
                        <div
                          className="p-6 flex flex-col gap-4 items-center justify-center border border-dashed border-button-accent-hover rounded-[16px] cursor-pointer hover:bg-button-accent/5 transition-colors"
                          onClick={() => resultImageInputRef.current?.click()}
                        >
                          <IoDocumentAttachOutline size={32} className="text-button-accent" />
                          <div className="flex flex-col gap-1 items-center text-center">
                            <span className="font-display-3 font-semibold text-button-accent">
                              {t('Drag and drop your images')}
                            </span>
                            <span className="font-display-2 text-button-accent-hover">
                              {t('JPEG, PNG, and WEBP formats, up to 50MB')}
                            </span>
                          </div>
                          <Button
                            variant="outlined-brown"
                            type="button"
                            isDisabled={busy || compressingResultImages}
                          >
                            {compressingResultImages ? t('Compressing...') : t('Select files')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="font-display-3 font-semibold text-button-accent">
                              {t('Uploaded Images')}
                            </span>
                            <button
                              type="button"
                              onClick={clearAllResultImages}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2.5 py-1 rounded-full border border-red-100"
                              disabled={busy}
                            >
                              {t('Clear all')}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <AntdImage.PreviewGroup>
                              {resultImages.map((image, index) => (
                                <ImagePreviewItem
                                  key={`${typeof image === 'string' ? image : index}`}
                                  image={image}
                                  index={index}
                                  onRemove={removeResultImage}
                                />
                              ))}
                            </AntdImage.PreviewGroup>

                            {resultImages.length < 10 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => resultImageInputRef.current?.click()}
                                    className="w-[120px] h-[120px] border-2 border-dashed border-button-accent-hover rounded-[15px] flex items-center justify-center cursor-pointer hover:bg-button-accent/5 transition-colors group"
                                    disabled={busy || compressingResultImages}
                                  >
                                    <BiPlus
                                      size={32}
                                      className="text-button-accent group-hover:scale-110 transition-transform"
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('Add more images')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          <span className="text-sm text-button-accent-hover font-medium">
                            {resultImages.length}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Field>
            </>
          )}
        </div>

        <DialogFooter className="space-x-2 sm:gap-0 pt-2 h-[50px]">
          <Button
            type="button"
            variant="outlined-brown"
            size="medium"
            onClick={onClose}
            isDisabled={busy}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="brown" size="medium" isLoading={busy} isDisabled={busy}>
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
});

export const PopoverCreateUpdateTask = memo(function PopoverCreateUpdateTask({
  open,
  onClose,
  task,
  campaignId,
  onSuccess,
}: PopoverCreateUpdateTaskProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <CreateUpdateTaskFormBody
          task={task}
          campaignId={campaignId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
});

export default PopoverCreateUpdateTask;
