import requestApi from "@/utils/requestApi";
import {
  IGetMyJoinRequestsRequest,
  IGetMyJoinRequestsResponse,
  IProcessJoinRequestRequest,
  IProcessJoinRequestResponse,
  ICancelJoinRequestRequest,
  ICancelJoinRequestResponse,
  ICreateOrganizationJoinRequestResponse,
} from "./models/joinRequestModels";
import {
  useGet,
  UseGetOptions,
  usePost,
  UsePostOptions,
} from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const baseurl = "/api/v1/organizations/join-requests";

/** POST /organizations/{id}/join-requests */
export const createOrganizationJoinRequest = async (
  organizationId: string,
): Promise<ICreateOrganizationJoinRequestResponse> => {
  return await requestApi.post<ICreateOrganizationJoinRequestResponse>(
    `/organizations/${organizationId}/join-requests`,
    {},
  );
};

export const useCreateOrganizationJoinRequest = (
  options?: UsePostOptions<
    ICreateOrganizationJoinRequestResponse,
    string
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createOrganizationJoinRequest,
    queryKey: ["my-join-requests"],
    messageSuccess: {
      content: t("Join request submitted successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// Get my join requests
export const getMyJoinRequests = async (
  req: IGetMyJoinRequestsRequest,
): Promise<IGetMyJoinRequestsResponse> => {
  return await requestApi.get<IGetMyJoinRequestsResponse>(`${baseUrl}/my`, req);
};

export const useGetMyJoinRequests = (
  req: IGetMyJoinRequestsRequest,
  options?: Omit<
    UseGetOptions<IGetMyJoinRequestsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["my-join-requests", req],
    queryFn: () => getMyJoinRequests(req),
    ...options,
  });
};

// Process join request
export const processJoinRequest = async (
  req: IProcessJoinRequestRequest,
): Promise<IProcessJoinRequestResponse> => {
  return await requestApi.put<IProcessJoinRequestResponse>(
    `${baseUrl}/process`,
    req,
  );
};

export const useProcessJoinRequest = (
  options?: UsePostOptions<
    IProcessJoinRequestResponse,
    IProcessJoinRequestRequest
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: processJoinRequest,
    messageSuccess: {
      content: t("Join request processed successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

// Cancel join request
export const cancelJoinRequest = async (
  req: ICancelJoinRequestRequest,
): Promise<ICancelJoinRequestResponse> => {
  return await requestApi.delete<ICancelJoinRequestResponse>(
    `${baseUrl}/cancel`,
    { data: req },
  );
};

export const useCancelJoinRequest = (
  options?: UsePostOptions<
    ICancelJoinRequestResponse,
    ICancelJoinRequestRequest
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: cancelJoinRequest,
    messageSuccess: {
      content: t("Join request cancelled successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
