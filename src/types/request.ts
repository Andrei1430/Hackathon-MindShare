export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestVisibility = 'public' | 'private';

export interface SessionRequest {
  id: string;
  title: string;
  description: string;
  datetime: string;
  visibility: RequestVisibility;
  status: RequestStatus;
  user_id: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRequestWithDetails extends SessionRequest {
  user_name: string;
  reviewer_name: string | null;
}
