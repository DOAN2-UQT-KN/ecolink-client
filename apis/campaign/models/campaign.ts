export interface ICampaign {
  id: string;
  organization_id?: string;
  title: string;
  description: string | null;

  status?: number;
  difficulty?: number;
  green_points?: number;

  is_verify?: boolean;

  created_by?: string | null;
  updated_by?: string | null;

  created_at: string; // ISO date
  updated_at: string; // ISO date

  report_ids?: string[];
  manager_ids?: string[];

  votes: {
    upvote_count: number;
    downvote_count: number;
    my_vote: number | null;
  };

  saved?: boolean | null;
  request_status?: number;
}

