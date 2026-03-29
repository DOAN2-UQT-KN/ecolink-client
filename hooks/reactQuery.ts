"use client";

import {
  MutationOptions,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { IBaseResponse } from "@/types/BaseResponse";
import { useTranslation } from "react-i18next";

export const CACHE_TIME_DEFAULT = 5 * 60 * 1000;

interface Message {
  content?: string | React.ReactNode;
  type?: MessageType;
}

export interface QueryError {
  message: string;
  success: boolean;
  errors?: {
    message: string;
    extensions?: {
      code?: string;
      status_code?: number;
    };
  }[];
}

export interface UsePostOptions<TResponse, TRequest>
  extends MutationOptions<TResponse, QueryError, TRequest> {
  queryKey?: QueryKey;
  silentError?: boolean;
  messageError?: Message;
  messageSuccess?: Message;
}

export const usePost = <TResponse extends IBaseResponse, TRequest>(
  options: UsePostOptions<TResponse, TRequest>,
) => {
  const {
    queryKey,
    silentError,
    messageError,
    messageSuccess,
    onSuccess,
    onError,
    onSettled,
    ...rest
  } = options;

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<TResponse, QueryError, TRequest>({
    ...rest,

    async onMutate() {
      if (queryKey?.length) {
        await queryClient.cancelQueries({ queryKey });
      }
    },

    onSuccess(data, variables, onMutateResult, context) {
      if (messageSuccess?.content) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Success,
          title:
            typeof messageSuccess.content === "string"
              ? t(messageSuccess.content)
              : messageSuccess.content,
        });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },

    onError(error, variables, onMutateResult, context) {
      if (!silentError) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title:
            error.errors?.[0]?.message ??
            messageError?.content ??
            error.message,
        });
      }

      onError?.(error, variables, onMutateResult, context);
    },

    onSettled(data, error, variables, onMutateResult, context) {
      if (queryKey?.length) {
        queryClient.invalidateQueries({ queryKey });
      }

      onSettled?.(data, error, variables, onMutateResult, context);
    },
  });
};
