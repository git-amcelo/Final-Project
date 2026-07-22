/**
 * API Client for GymBuddy Django Backend
 * Handles JWT authentication and API requests
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token management
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('recentlyViewed');
};

import { getImageUrl } from './utils';

const fixImageUrls = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(fixImageUrls);
  
  const newObj = { ...obj };
  
  // Cross-pollinate if one is missing but the other exists
  if (!newObj.profile_picture_url && newObj.profile_picture && typeof newObj.profile_picture === 'string') {
    newObj.profile_picture_url = newObj.profile_picture;
  }

  for (const key in newObj) {
    if ((key === 'profile_picture_url' || key === 'profile_picture') && typeof newObj[key] === 'string') {
      newObj[key] = getImageUrl(newObj[key]);
    } else if (typeof newObj[key] === 'object') {
      newObj[key] = fixImageUrls(newObj[key]);
    }
  }
  return newObj;
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  clearTokens();
  return false;
};

// API request wrapper
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    body,
    headers = {},
    skipAuth = false,
  } = options;

  let token = getAccessToken();

  // Try to refresh if no token
  if (!token && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    token = getAccessToken();
  }

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Only set application/json if body is not FormData
  const isFormData = body instanceof FormData;
  if (!isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token && !skipAuth) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // Try refreshing on 401
  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = getAccessToken();
      requestHeaders['Authorization'] = `Bearer ${token}`;
      response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    console.error('API Error Response:', error);

    // Handle Django-style error responses
    if (typeof error === 'object' && error !== null) {
      // Check for specific error fields
      if (error.non_field_errors) {
        throw new Error(Array.isArray(error.non_field_errors) ? error.non_field_errors.join(', ') : error.non_field_errors);
      }
      if (error.detail) {
        throw new Error(error.detail);
      }
      if (error.error) {
        throw new Error(error.error);
      }

      // Handle field-level errors
      const errorMessages = Object.entries(error)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          }
          return `${key}: ${value}`;
        })
        .join('; ');
      throw new Error(errorMessages || 'Request failed');
    }

    throw new Error(error?.detail || error?.error || 'Request failed');
  }

  if (response.status === 204) {
    return null as any;
  }

  const data = await response.json();
  return fixImageUrls(data);
};

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string; password_confirm: string }) =>
    apiRequest('/register/', { method: 'POST', body: data, skipAuth: true }),

  forgotPassword: (email: string, newPassword: string) =>
    apiRequest('/forgot-password/', { method: 'POST', body: { email, new_password: newPassword }, skipAuth: true }),

  login: async (username: string, password: string) => {
    const response = await apiRequest<{
      access: string;
      refresh: string;
      user: { id: number; username: string; email: string };
    }>('/token/', {
      method: 'POST',
      body: { username, password },
      skipAuth: true,
    });

    setTokens(response.access, response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },

  logout: () => {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    const data = await apiRequest('/profile/');
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.profile_picture_url = data.profile_picture_url;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user_updated'));
      }
    }
    return data;
  },
  updateProfile: (data: any) => apiRequest('/profile/', { method: 'PATCH', body: data }),
  updateProfilePicture: async (formData: FormData) => {
    const data = await apiRequest('/profile-picture/', { method: 'POST', body: formData });
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.profile_picture_url = data.profile_picture_url;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user_updated'));
      }
    }
    return data;
  },
  getPublicProfile: (id: number) => apiRequest(`/${id}/`),
  listUsers: (params?: Record<string, string>) =>
    apiRequest(`/?${new URLSearchParams(params)}`),

  // Social
  addFavorite: (userId: number) =>
    apiRequest('/favorites/', { method: 'POST', body: { favorite: userId } }),
  removeFavorite: (id: number) =>
    apiRequest(`/favorites/${id}/`, { method: 'DELETE' }),
  getFavorites: () => apiRequest('/favorites/'),

  blockUser: (userId: number) =>
    apiRequest('/blocked/', { method: 'POST', body: { blocked: userId } }),
  unblockUser: (id: number) =>
    apiRequest(`/blocked/${id}/`, { method: 'DELETE' }),
  getBlocked: () => apiRequest('/blocked/'),
};

// Workout API
export const workoutApi = {
  listWorkouts: (params?: Record<string, string>) =>
    apiRequest(`/workouts/?${new URLSearchParams(params)}`),
  createWorkout: (data: any) =>
    apiRequest('/workouts/', { method: 'POST', body: data }),
  getWorkout: (id: number) => apiRequest(`/workouts/${id}/`),
  updateWorkout: (id: number, data: any) =>
    apiRequest(`/workouts/${id}/`, { method: 'PATCH', body: data }),
  deleteWorkout: (id: number) =>
    apiRequest(`/workouts/${id}/`, { method: 'DELETE' }),
  requestToJoin: (workoutId: number) =>
    apiRequest(`/workouts/${workoutId}/request/`, { method: 'POST' }),
  acceptParticipant: (workoutId: number, userId: number) =>
    apiRequest(`/workouts/${workoutId}/accept/${userId}/`, { method: 'POST' }),
  rejectParticipant: (workoutId: number, userId: number) =>
    apiRequest(`/workouts/${workoutId}/reject/${userId}/`, { method: 'POST' }),
  leaveWorkout: (workoutId: number) =>
    apiRequest(`/workouts/${workoutId}/leave/`, { method: 'POST' }),
  getMyWorkouts: () => apiRequest('/workouts/my/'),
  getAvailableWorkouts: (params?: Record<string, string>) =>
    apiRequest(`/workouts/available/?${params ? new URLSearchParams(params) : ''}`),
};

// Groups API
export const groupApi = {
  listGroups: (params?: Record<string, string>) =>
    apiRequest(`/groups/?${new URLSearchParams(params)}`),
  createGroup: (data: any) =>
    apiRequest('/groups/', { method: 'POST', body: data }),
  getGroup: (slug: string) => apiRequest(`/groups/${slug}/`),
  updateGroup: (slug: string, data: any) =>
    apiRequest(`/groups/${slug}/`, { method: 'PATCH', body: data }),
  deleteGroup: (slug: string) =>
    apiRequest(`/groups/${slug}/`, { method: 'DELETE' }),
  joinGroup: (slug: string, message?: string) =>
    apiRequest(`/groups/${slug}/join/`, { method: 'POST', body: { message } }),
  leaveGroup: (slug: string) =>
    apiRequest(`/groups/${slug}/leave/`, { method: 'POST' }),
  approveMember: (slug: string, userId: number) =>
    apiRequest(`/groups/${slug}/approve/${userId}/`, { method: 'POST' }),
  removeMember: (slug: string, userId: number) =>
    apiRequest(`/groups/${slug}/remove/${userId}/`, { method: 'POST' }),
  getMyGroups: () => apiRequest('/groups/my/'),
  listGroupWorkouts: (slug: string) => apiRequest(`/groups/${slug}/workouts/`),
  createGroupWorkout: (slug: string, data: any) =>
    apiRequest(`/groups/${slug}/workouts/`, { method: 'POST', body: data }),
  rsvpWorkout: (workoutId: number, status: string) =>
    apiRequest(`/groups/workouts/${workoutId}/rsvp/`, { method: 'POST', body: { status } }),
};

// Matching API
export const matchingApi = {
  findBuddies: (filters: any) =>
    apiRequest('/matching/find-buddies/', { method: 'POST', body: filters }),
  getTopMatches: () => apiRequest('/matching/top-matches/'),
  getCompatibility: (userId: number) => apiRequest(`/matching/compatibility/${userId}/`),
  getPreferences: () => apiRequest('/matching/preferences/'),
  updatePreferences: (data: any) =>
    apiRequest('/matching/preferences/', { method: 'PUT', body: data }),
};

// Ratings API
export const ratingApi = {
  listRatings: (params?: Record<string, string>) =>
    apiRequest(`/ratings/?${new URLSearchParams(params)}`),
  createRating: (data: any) =>
    apiRequest('/ratings/', { method: 'POST', body: data }),
  getRating: (id: number) => apiRequest(`/ratings/${id}/`),
  updateRating: (id: number, data: any) =>
    apiRequest(`/ratings/${id}/`, { method: 'PATCH', body: data }),
  deleteRating: (id: number) =>
    apiRequest(`/ratings/${id}/`, { method: 'DELETE' }),
  getUserStats: (userId: number) => apiRequest(`/ratings/stats/${userId}/`),
  getMyStats: () => apiRequest('/ratings/summary/'),
  getRecentRatings: () => apiRequest('/ratings/recent/'),
  getWorkoutRatings: (workoutId: number) => apiRequest(`/ratings/session/${workoutId}/`),
  rateWorkoutPartner: (workoutId: number, data: any) =>
    apiRequest(`/ratings/session/${workoutId}/rate/`, { method: 'POST', body: data }),
};
