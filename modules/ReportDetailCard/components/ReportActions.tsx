"use client";

import React from "react";
import { PiShareNetwork } from "react-icons/pi";
import {
  TbArrowBigDown,
  TbArrowBigDownFilled,
  TbArrowBigUp,
  TbArrowBigUpFilled,
} from "react-icons/tb";

import { useReportVotes } from "../hooks/useReportVotes";
import { cn } from "@/libs/utils";

interface ReportActionsProps {
  reportId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialVotePoint?: number;
  initialUserVote?: number | null;
}

export const ReportActions: React.FC<ReportActionsProps> = ({
  reportId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialVotePoint = 0,
  initialUserVote = null,
}) => {
  const { userVote, handleVote, isVoting } = useReportVotes(
    reportId,
    initialVotePoint,
    initialUserVote,
  );

  const votePoint = initialVotePoint; // Use the prop directly as it reflects the refetched data

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center h-10 px-4 bg-muted/60 dark:bg-accent/30 rounded-full transition-all">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(1);
          }}
          disabled={isVoting}
          className={cn(
            "p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer",
            userVote === 1 ? "text-emerald-600" : "text-foreground-secondary",
          )}
          aria-label="Upvote"
        >
          {userVote === 1 ? (
            <TbArrowBigUpFilled size={20} />
          ) : (
            <TbArrowBigUp size={20} />
          )}
        </button>

        <span className="mx-2 font-display-2 font-semibold text-foreground min-w-[20px] text-center">
          {votePoint}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(-1);
          }}
          disabled={isVoting}
          className={cn(
            "p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10  cursor-pointer",
            userVote === -1 ? "text-rose-600" : "text-foreground-secondary",
          )}
          aria-label="Downvote"
        >
          {userVote === -1 ? (
            <TbArrowBigDownFilled size={20} />
          ) : (
            <TbArrowBigDown size={20} />
          )}
        </button>
      </div>

      <button
        className="p-2.5 rounded-full hover:bg-muted/80 text-foreground-secondary transition-colors group"
        onClick={(e) => e.stopPropagation()}
      >
        <PiShareNetwork
          size={22}
          className="group-hover:scale-110 transition-transform"
        />
      </button>
    </div>
  );
};
