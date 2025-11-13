

export interface Profile {
  id: string; // Corresponds to Supabase auth.users.id
  username: string;
  bio: string | null;
  interests: string[] | null;
  avatar_url: string | null;
  updated_at: string;
  birth_date: string | null; // Added for age calculation
  gemini_analysis?: string | null; // Optional field for AI-generated analysis
}

export interface Action {
    id?: number;
    user_id: string; // The user performing the action
    target_id: string; // The user being acted upon
    action_type: 'like' | 'dislike';
    created_at?: string;
}