import requestApi from '@/utils/requestApi';
import { usePost, type UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import type {
  ICreateAdminBadgeBody,
  ICreateAdminBadgeResponse,
  IPatchAdminBadgeBody,
  IPatchAdminBadgeResponse,
} from '@/apis/gamification/models/gamificationBadge';

const adminBadgesUrl = '/api/v1/admin/gamification/badges';

export const createAdminBadge = async (
  body: ICreateAdminBadgeBody,
): Promise<ICreateAdminBadgeResponse> => {
  return await requestApi.post<ICreateAdminBadgeResponse>(adminBadgesUrl, body);
};

export const patchAdminBadge = async (req: {
  id: string;
  body: IPatchAdminBadgeBody;
}): Promise<IPatchAdminBadgeResponse> => {
  const { id, body } = req;
  return await requestApi.patch<IPatchAdminBadgeResponse>(
    `${adminBadgesUrl}/${id}`,
    body,
  );
};

export const useCreateAdminBadge = (
  options?: UsePostOptions<ICreateAdminBadgeResponse, ICreateAdminBadgeBody>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createAdminBadge,
    queryKey: ['gamification', 'admin', 'badges'],
    messageSuccess: {
      content: t('Badge created successfully'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const usePatchAdminBadge = (
  options?: UsePostOptions<
    IPatchAdminBadgeResponse,
    { id: string; body: IPatchAdminBadgeBody }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: patchAdminBadge,
    queryKey: ['gamification', 'admin', 'badges'],
    messageSuccess: {
      content: t('Badge updated successfully'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
