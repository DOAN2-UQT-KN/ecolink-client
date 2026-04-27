'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
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
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { useCreateCampaignTask, useUpdateCampaignTask } from '@/apis/campaign/campaignTask';
import { ICampaignTask } from '@/apis/campaign/models/campaignTask';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/libs/utils';
import { Calendar } from '@/components/ui/calendar';
import SelectListPriority from '@/components/form/SelectListPriority';
import { PRIORITY } from '@/constants/priority';
import { parseScheduledTimeRange } from '@/utils/scheduledTimeRange';

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
  result?: string;
  status?: number;
};

const CreateUpdateTaskFormBody = memo(function CreateUpdateTaskFormBody({
  task,
  campaignId,
  onClose,
  onSuccess,
}: Omit<PopoverCreateUpdateTaskProps, 'open'>) {
  const { t } = useTranslation();
  const isCreate = !task;

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
      //   result: task?.result || '',
      status: task?.status ?? 1,
    };
  }, [task]);

  const form = useForm<TaskFormValues>({
    defaultValues,
  });

  const {
    register,
    handleSubmit,
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

  const busy = isCreating || isUpdating;

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

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
        await updateMutate({
          id: task.id,
          title: data.title.trim(),
          description: data.description.trim(),
          scheduled_date: new Date(data.scheduled_date).toISOString(),
          scheduled_time: scheduleTimeRange,
          priority: Number(data.priority),
          result: data.result?.trim() || '',
          status: Number(data.status),
        });
      }
    },
    [isCreate, createMutate, updateMutate, campaignId, task],
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
              disabled={busy}
            />
            <FieldError errors={[errors.title]} />
          </Field>

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
                        !fromTime || value > fromTime || t('End time must be later than start time')
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

          {!isCreate && (
            <>
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Result')}
                </FieldLabel>
                <Textarea
                  {...register('result')}
                  placeholder={t('Enter result...')}
                  className={inputClassName}
                  disabled={busy}
                />
                <FieldError errors={[errors.result]} />
              </Field>

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Status')}
                </FieldLabel>
                <Input
                  type="number"
                  {...register('status', { valueAsNumber: true })}
                  placeholder={t('Enter status...')}
                  className={inputClassName}
                  disabled={busy}
                />
                <FieldError errors={[errors.status]} />
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
