import { useState, useCallback } from "react";
import { voteService } from "../_services/voting.service";

export const useReportVotes = (
  reportId: string,
  initialUp: number,
  initialDown: number,
  initialVotePoint: number = 0,
) => {
  const [upvotes, setUpvotes] = useState(initialUp);
  const [downvotes, setDownvotes] = useState(initialDown);
  const [votePoint, setVotePoint] = useState(initialVotePoint);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = useCallback(
    async (type: 1 | -1) => {
      if (isVoting) return;

      setIsVoting(true);

      const nextVote = userVote === type ? null : type;

      const response = await voteService.submitVote(reportId, nextVote);

      if (response.success) {
        setUserVote(nextVote);
        setUpvotes(response.upvotes);
        setDownvotes(response.downvotes);
        // If the service doesn't return votePoint, calculate it
        setVotePoint(response.upvotes - response.downvotes);
      }

      setIsVoting(false);
    },
    [isVoting, reportId, userVote],
  );

  return {
    upvotes,
    downvotes,
    votePoint,
    userVote,
    isVoting,
    handleVote,
  };
};
