export interface VoteResponse {
  success: boolean;
  upvotes: number;
  downvotes: number;
  userVote: number | null; // 1 for up, -1 for down, null for none
}

const mockVotes: Record<string, { up: number; down: number }> = {};

export const voteService = {
  submitVote: async (
    reportId: string,
    vote: 1 | -1 | null,
  ): Promise<VoteResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!mockVotes[reportId]) {
      mockVotes[reportId] = {
        up: Math.floor(Math.random() * 100),
        down: Math.floor(Math.random() * 20),
      };
    }

    const current = mockVotes[reportId];

    return {
      success: true,
      upvotes: vote === 1 ? current.up + 1 : current.up,
      downvotes: vote === -1 ? current.down + 1 : current.down,
      userVote: vote,
    };
  },
};
