import React, { createContext, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateReport } from '@/apis/incident/createReport';
import { ICreateReportImage } from '@/apis/incident/models/createReport';
import { QueryError } from '@/hooks/reactQuery';
import { apiErrorMessage } from '@/constants/apiErrorMessages';
import { uploadWithCapture } from '@/libs/cloudinary';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import {
  IncidentFormValues,
  IncidentImage,
  mapValidationPath,
  transformToApiData,
} from '../_services/incident.service';
import { useRouter } from '@/libs/router';
import { queryClient } from '@/libs/queryClient';

interface IncidentContextType {
  form: UseFormReturn<IncidentFormValues>;
  onSubmit: (data: IncidentFormValues) => void;
  isPending: boolean;
  isUploading: boolean;
}

/** Extra fields the report gate puts on its error body (specs/006 contracts, research R1). */
type CreateReportError = QueryError & {
  retry_after?: string;
  errors?: { path?: string; msg?: string }[];
};

export const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

/** Upload one image unless it is already a URL (kept from an earlier attempt). */
async function uploadImage(image: IncidentImage): Promise<{ image: IncidentImage; payload: ICreateReportImage }> {
  const { source, capture } = image;
  if (typeof source === 'string' && !source.startsWith('data:')) {
    return { image, payload: capture ? { url: source, capture_id: capture.id } : { url: source } };
  }
  const { url, captureId } = await uploadWithCapture(source, capture);
  return captureId
    ? { image: { source: url, capture }, payload: { url, capture_id: captureId } }
    : { image: { source: url }, payload: { url } };
}

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [isUploading, setIsUploading] = React.useState(false);
  // One key per form fill: every retry reuses it so the server creates a single report.
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<IncidentFormValues>({
    defaultValues: {
      title: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
      detailAddress: '',
      category: '',
      wasteTypes: [],
      condition: '',
      severityLevel: 1,
      images: [],
    },
  });

  const handleCreateError = useCallback(
    (error: CreateReportError) => {
      const message = apiErrorMessage(error, t) ?? error.message;
      switch (error.code) {
        case 'REPORT_OUT_OF_SERVICE_AREA':
          form.setError('latitude', { type: error.code, message });
          document.getElementById('incident-address')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        case 'REPORT_RATE_LIMITED': {
          const retryAt = error.retry_after ? new Date(error.retry_after) : null;
          const when =
            retryAt && !Number.isNaN(retryAt.getTime())
              ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(retryAt)
              : null;
          form.setError('root.server', {
            type: error.code,
            message: when ? `${message}. ${t('You can send again at {{time}}', { time: when })}` : message,
          });
          return;
        }
        case 'VALIDATION_ERROR': {
          const unmapped: string[] = [];
          for (const item of error.errors ?? []) {
            const field = mapValidationPath(item.path);
            if (field) form.setError(field, { type: 'server', message: item.msg });
            else if (item.msg) unmapped.push(item.msg);
          }
          if (unmapped.length > 0 || !error.errors?.length) {
            form.setError('root.server', { type: error.code, message: unmapped.join('. ') || message });
          }
          return;
        }
        default:
          showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: message || t('Something went wrong') });
      }
    },
    [form, i18n.language, t],
  );

  const { mutate: createIncident, isPending } = useCreateReport({
    silentError: true,
    onSuccess: (res) => {
      form.reset();
      idempotencyKeyRef.current = crypto.randomUUID();
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['all-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      const id = res?.data?.report?.id;
      router.push(id ? `/incidents/${id}` : '/incidents/me');
    },
    onError: (error) => handleCreateError(error as CreateReportError),
  });

  const onSubmit = useCallback(
    async (data: IncidentFormValues) => {
      form.clearErrors('root.server');
      let uploaded: Awaited<ReturnType<typeof uploadImage>>[];
      try {
        setIsUploading(true);
        uploaded = await Promise.all(data.images.map(uploadImage));
      } catch {
        showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload images') });
        return;
      } finally {
        setIsUploading(false);
      }
      // Keep the URLs in the form so a retry after a network error does not upload again.
      form.setValue('images', uploaded.map((u) => u.image));
      createIncident({
        data: transformToApiData(data, uploaded.map((u) => u.payload)),
        idempotencyKey: idempotencyKeyRef.current,
      });
    },
    [createIncident, form, t],
  );

  const contextValue = useMemo(
    () => ({ form, onSubmit, isPending, isUploading }),
    [form, onSubmit, isPending, isUploading],
  );

  return (
    <IncidentContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};
