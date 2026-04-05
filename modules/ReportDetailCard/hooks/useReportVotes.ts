import { useState, useCallback } from "react";
import { useUpvote, useDownvote } from "@/apis/vote";
import { useQueryClient } from "@tanstack/react-query";

export const useReportVotes = (
  reportId: string,
  initialVotePoint: number = 0,
) => {
  const queryClient = useQueryClient();
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const { mutateAsync: upvote } = useUpvote();
  const { mutateAsync: downvote } = useDownvote();

  const handleVote = useCallback(
    async (type: 1 | -1) => {
      if (isVoting) return;
      setIsVoting(true);

      try {
        let response;
        if (type === 1) {
          response = await upvote({
            resource_id: reportId,
            resource_type: "report",
          });
        } else {
          response = await downvote({
            resource_id: reportId,
            resource_type: "report",
          });
        }

        if (response.success) {
          const newVal = response.data.vote.value;
          setUserVote(newVal === 0 ? null : (newVal as 1 | -1));
          
          // Refetch report details to get updated vote counts
          await queryClient.invalidateQueries({
            queryKey: ["report-detail", reportId],
          });
        }
      } catch (error) {
        console.error("Failed to vote:", error);
      } finally {
        setIsVoting(false);
      }
    },
    [isVoting, reportId, upvote, downvote, queryClient],
  );

  return {
    userVote,
    isVoting,
    handleVote,
  };
};
