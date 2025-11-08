export type SessionVisibility = 'public' | 'private';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  datetime: string;
  presentation_url: string | null;
  recording_url: string | null;
  visibility: SessionVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SessionWithDetails extends Session {
  tags: Tag[];
  creator_name: string;
  is_guest?: boolean;
  isInterested?: boolean;
  canView?: boolean;
}
