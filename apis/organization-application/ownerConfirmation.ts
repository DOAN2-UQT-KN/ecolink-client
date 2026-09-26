import requestApi from "@/utils/requestApi";
import { useGet, UseGetOptions, usePost, UsePostOptions } from "@/hooks/reactQuery";
import { MessageType } from "@/utils/showMessage";
import {
  IConfirmOwnerResponse,
  IDeclineOwnerRequest,
  IDeclineOwnerResponse,
  IGetOwnerConfirmationResponse,
} from "./models/ownerConfirmation";

const url = "/api/v1/organization-applications/owner-confirmations";

/** Public: the token from the confirmation email is the only credential. */
export const getOwnerConfirmation = async (
  token: string,
): Promise<IGetOwnerConfirmationResponse> => {
  return await requestApi.get<IGetOwnerConfirmationResponse>(
    `${url}/${encodeURIComponent(token)}`,
  );
};

export const useGetOwnerConfirmation = (
  token: string,
  options?: Omit<
    UseGetOptions<IGetOwnerConfirmationResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["owner-confirmation", token],
    queryFn: () => getOwnerConfirmation(token),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const confirmOwner = async (req: {
  token: string;
}): Promise<IConfirmOwnerResponse> => {
  return await requestApi.post<IConfirmOwnerResponse>(
    `${url}/${encodeURIComponent(req.token)}/confirm`,
    {},
  );
};

export const useConfirmOwner = (
  options?: UsePostOptions<IConfirmOwnerResponse, { token: string }>,
) => {
  return usePost({
    mutationFn: confirmOwner,
    queryKey: ["owner-confirmation"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const declineOwner = async ({
  token,
  ...data
}: IDeclineOwnerRequest): Promise<IDeclineOwnerResponse> => {
  return await requestApi.post<IDeclineOwnerResponse>(
    `${url}/${encodeURIComponent(token)}/decline`,
    data,
  );
};

export const useDeclineOwner = (
  options?: UsePostOptions<IDeclineOwnerResponse, IDeclineOwnerRequest>,
) => {
  return usePost({
    mutationFn: declineOwner,
    queryKey: ["owner-confirmation"],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
