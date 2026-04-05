import requestApi from "@/utils/requestApi";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { IVoteRequest, IVoteResponse } from "./models/vote";

const upvoteUrl = "/votes/upvote";
const downvoteUrl = "/votes/downvote";

export const postUpvote = async (
  data: IVoteRequest,
): Promise<IVoteResponse> => {
  return await requestApi.post<IVoteResponse>(upvoteUrl, data);
};

export const postDownvote = async (
  data: IVoteRequest,
): Promise<IVoteResponse> => {
  return await requestApi.post<IVoteResponse>(downvoteUrl, data);
};

export const useUpvote = (
  options?: UsePostOptions<IVoteResponse, IVoteRequest>,
) => {
  return usePost({
    mutationFn: (data: IVoteRequest) => postUpvote(data),
    ...options,
  });
};

export const useDownvote = (
  options?: UsePostOptions<IVoteResponse, IVoteRequest>,
) => {
  return usePost({
    mutationFn: (data: IVoteRequest) => postDownvote(data),
    ...options,
  });
};
