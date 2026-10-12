import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { IResultPhotoCheck, UploadResultPhotoParams } from './models/shiftResult';

const url = '/api/v1/campaigns';

/**
 * Uploads the original file of a trash point photo (no compression: the server reads its EXIF and
 * hash), with where the uploader pinned it. The PUT of the result accepts only URLs from here.
 */
export const uploadResultPhoto = ({ campaign_id, shift_id, file, ...fields }: UploadResultPhotoParams) => {
  const form = new FormData();
  form.append('report_id', fields.report_id);
  form.append('side', fields.side);
  form.append('pin_lat', String(fields.pin_lat));
  form.append('pin_lng', String(fields.pin_lng));
  form.append('file', file);
  return requestApi.post<IBaseResponse<{ url: string; check: IResultPhotoCheck }>>(
    `${url}/${campaign_id}/shifts/${shift_id}/result-photos`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

export const useUploadResultPhoto = (
  options?: UsePostOptions<IBaseResponse<{ url: string; check: IResultPhotoCheck }>, UploadResultPhotoParams>,
) =>
  usePost({
    mutationFn: uploadResultPhoto,
    messageError: { type: MessageType.Toast },
    ...options,
  });
