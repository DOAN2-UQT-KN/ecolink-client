'use client';

import { memo, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/client/shared/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { useCreateCampaignTask, useUpdateCampaignTask } from '@/apis/campaign/campaignTask';
import { ICampaignTask } from '@/apis/campaign/models/campaignTask';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/libs/utils';
import { Calendar } from '@/components/ui/calendar';
import ChangePriority from '@/components/ui/ChangePriority';

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
  scheduled_time: string;
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

  const defaultValues = useMemo(
    (): TaskFormValues => ({
      title: task?.title || task?.name || '',
      description: task?.description || '',
      scheduled_time: task?.scheduled_time
        ? new Date(task.scheduled_time).toISOString().substring(0, 16)
        : '',
      priority: task?.priority ?? 1,
      result: task?.result || '',
      status: task?.status ?? 1,
    }),
    [task],
  );

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

  const busy = isCreating || isUpdating;

  const inputClassName = useMemo(
    () =>
      'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50',
    [],
  );

  const onValidSubmit = useCallback(
    async (data: TaskFormValues) => {
      if (isCreate) {
        await createMutate({
          campaignId,
          title: data.title.trim(),
          description: data.description.trim(),
          scheduled_time: new Date(data.scheduled_time).toISOString(),
          priority: Number(data.priority),
        });
      } else {
        if (!task) return;
        await updateMutate({
          id: task.id,
          title: data.title.trim(),
          description: data.description.trim(),
          scheduled_time: new Date(data.scheduled_time).toISOString(),
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

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Schedule Date')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              control={form.control}
              name="scheduled_time"
              rules={{ required: t('Schedule date is required') }}
              render={({ field }) => (
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date ? date.toISOString() : '')}
                  className="rounded-md border border-[rgba(136,122,71,0.5)] shadow w-fit bg-background"
                  disabled={busy}
                />
              )}
            />
            <FieldError errors={[errors.scheduled_time]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Priority')}
            </FieldLabel>
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <div className="flex items-center">
                  <ChangePriority
                    type={field.value}
                    onChangePriority={field.onChange}
                    enabledDropdown={!busy}
                  />
                </div>
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
