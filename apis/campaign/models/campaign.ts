export interface ICampaign {
  id: string;
  organization_id?: string;
  title: string;
  description: string;

  status?: number;
  difficulty?: number;
  green_points?: number;

  is_verify?: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string; // ISO date
  updated_at: string; // ISO date

  report_ids?: string[];
  manager_ids?: string[];

  votes: {
    upvote_count: number;
    downvote_count: number;
    my_vote: number;
  };

  saved?: boolean;
  request_status?: number;

  banner?: string;
  detail_address?: string;
  start_date?: string;
  end_date?: string;
}

