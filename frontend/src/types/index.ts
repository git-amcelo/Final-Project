// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'student' | 'alumni';
  has_profile?: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio: string;
  profile_picture: string | null;
  profile_picture_url: string | null;
  gender: 'M' | 'F' | 'O' | 'N' | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  fitness_goals: string[];
  preferred_genders: string[];
  availability: Record<string, string[]>;
  gym_preferences: string[];
  interests: string[];
  certifications: string[];
  average_rating: number;
  total_ratings: number;
  joined_date: string;
  last_active: string;
  is_visible: boolean;
}

// Workout Types
export interface Workout {
  id: number;
  title: string;
  description: string;
  creator: number;
  creator_name: string;
  creator_profile: UserProfile;
  participant: number | null;
  participant_name: string | null;
  participant_profile: UserProfile | null;
  session_type?: string;
  workout_type: '1on1' | 'small_group' | 'large_group';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  scheduled_datetime: string;
  duration_minutes: number;
  location: string;
  intensity?: string;
  focus_areas: string[];
  equipment_needed: string[];
  max_participants: number;
  current_participants: number;
  skill_level: string;
  is_past: boolean;
  is_creator: boolean;
  is_participant: boolean;
  has_pending_request: boolean;
  can_join: boolean;
  join_requests: {
    id: number;
    requester: number;
    requester_username: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    created_at: string;
    responded_at: string | null;
  }[];
  notes: string;
  created_at: string;
  updated_at: string;
}

// Group Types
export interface WorkoutGroup {
  id: number;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  group_type: 'open' | 'closed' | 'private';
  is_private: boolean;
  max_members: number;
  member_count: number;
  member_count_actual: number;
  focus_areas: string[];
  interests: string[];
  workout_frequency: string;
  primary_location: string;
  location: string;
  meeting_days: string[];
  typical_time: string;
  fitness_level_required: string;
  skill_level: string;
  equipment_needed: string[];
  requirements: string;
  group_image: string | null;
  group_image_url: string | null;
  creator: number;
  creator_name: string;
  creator_profile: UserProfile;
  session_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_member: boolean;
  is_creator: boolean;
  is_past: boolean;
  user_role: string | null;
  members?: any[];
  members_list?: any[];
  upcoming_sessions?: any[];
  created_at: string;
  updated_at: string;
}

// Matching Types
export interface MatchRequest {
  fitness_level?: string;
  gender?: string;
  goals?: string[];
  availability_day?: string;
  location?: string;
  interests?: string[];
  min_rating?: number;
}

export interface MatchedUser {
  profile: UserProfile;
  compatibility_score: number;
  match_reasons: string[];
  breakdown: any;
}

export interface MatchResponse {
  matches: MatchedUser[];
  total_found: number;
}

// Rating Types
export interface Rating {
  id: number;
  from_user: number;
  from_user_name: string;
  from_user_profile: UserProfile;
  to_user: number;
  to_user_name: string;
  to_user_profile: UserProfile;
  workout: number | null;
  workout_title: string | null;
  group: number | null;
  group_name: string | null;
  score: number;
  punctuality: number | null;
  communication: number | null;
  effort: number | null;
  knowledge: number | null;
  comment: string;
  would_workout_again: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingStats {
  total_ratings: number;
  average_score: number;
  score_distribution: Record<string, number>;
  would_workout_again_percentage: number;
  category_averages: {
    punctuality: number;
    communication: number;
    effort: number;
    knowledge: number;
  };
}

// Auth Types
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T;
}
