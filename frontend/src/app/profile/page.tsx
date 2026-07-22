'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userApi } from '@/lib/api';
import { UserProfile } from '@/types';
import {
  Camera,
  MapPin,
  Calendar,
  Trophy,
  Target,
  Save,
  X,
  LogOut,
  Star,
} from 'lucide-react';
import { authApi, ratingApi } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  const handleLogout = () => {
    authApi.logout();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          fetchRatings(user.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (userId: number) => {
    try {
      const [receivedRes, givenRes] = await Promise.all([
        ratingApi.listRatings({ user_id: String(userId) }),
        ratingApi.listRatings({ from_user_id: String(userId) })
      ]);
      setReviewsReceived(receivedRes.results || receivedRes);
      setReviewsGiven(givenRes.results || givenRes);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await userApi.updateProfile({
        bio: profile.bio,
        fitness_level: profile.fitness_level,
        fitness_goals: profile.fitness_goals,
        interests: profile.interests,
        availability: profile.availability,
        gym_preferences: profile.gym_preferences,
        gender: profile.gender,
      });
      setIsEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      await userApi.updateProfilePicture(formData);
      await fetchProfile();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-data text-lg">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        {/* Header */}
        <div className="bg-paper border-b border-black">
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="font-heading font-bold text-3xl">My Profile</h1>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-black rounded-xl font-heading font-medium hover:bg-black/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 border border-black rounded-xl font-heading font-medium text-black hover:bg-black hover:text-white transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Profile Card */}
          <div className="bg-white border border-black rounded-2xl overflow-hidden mb-8">
            {/* Cover & Avatar */}
            <div className="relative h-48 bg-gradient-to-r from-signal to-signal/70">
              <div className="absolute -bottom-16 left-8">
                <div className="relative">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-2xl border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white flex items-center justify-center">
                      <span className="font-heading font-bold text-4xl text-black/30">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-20 px-8 pb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-heading font-bold text-3xl">{profile.username}</h2>
                  <p className="font-data text-black/60 capitalize">
                    {profile.fitness_level} • {profile.total_ratings} reviews
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-signal/10 px-4 py-2 rounded-xl">
                  <Trophy className="w-5 h-5 text-signal" />
                  <span className="font-heading font-bold text-xl">{profile.average_rating.toFixed(1)}</span>
                </div>
              </div>

              {isEditing ? (
                <EditMode profile={profile} setProfile={setProfile} />
              ) : (
                <ViewMode profile={profile} />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Joined" value={new Date(profile.joined_date).toLocaleDateString()} />
            <StatCard label="Workouts" value="0" />
            <StatCard label="Groups" value="0" />
          </div>
        </div>

        {/* Ratings Section */}
        <div className="max-w-4xl mx-auto px-8 pb-12 mt-8">
          <div className="bg-white border border-black rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-6 border-b border-black">
              <button
                onClick={() => setActiveTab('received')}
                className={`pb-4 font-heading font-bold text-xl transition-colors relative ${
                  activeTab === 'received' ? 'text-black' : 'text-black/40 hover:text-black/60'
                }`}
              >
                Reviews Received ({reviewsReceived.length})
                {activeTab === 'received' && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-signal" />
                )}
              </button>
                <button
                  onClick={() => setActiveTab('given')}
                  className={`pb-4 font-heading font-bold text-xl transition-colors relative ${
                    activeTab === 'given' ? 'text-black' : 'text-black/40 hover:text-black/60'
                  }`}
                >
                  Reviews Given ({reviewsGiven.length})
                  {activeTab === 'given' && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-signal" />
                  )}
                </button>
              </div>

              <div className="space-y-5">
                {(activeTab === 'received' ? reviewsReceived : reviewsGiven).slice(0, 10).map((rating) => (
                  <div key={rating.id} className="p-6 bg-paper border border-black rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-data text-lg font-bold">
                          {activeTab === 'received' ? rating.from_user_name : rating.to_user_name}
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < rating.score
                                  ? 'fill-signal text-signal'
                                  : 'text-black/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="font-data text-sm text-black/60">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="font-data text-base text-black/80 leading-relaxed">{rating.comment}</p>
                    )}
                    {rating.session_title && (
                      <p className="font-data text-sm text-black/50 mt-2 flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Workout: {rating.session_title}
                      </p>
                    )}
                  </div>
                ))}
                {(activeTab === 'received' ? reviewsReceived : reviewsGiven).length === 0 && (
                  <p className="font-data text-black/50 text-center py-4">No reviews to show yet.</p>
                )}
              </div>
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ViewMode({ profile }: { profile: UserProfile }) {
  return (
    <>
      {/* Bio */}
      <div className="mb-6">
        <h3 className="font-heading font-bold text-lg mb-2">About</h3>
        <p className="font-data text-black/70">{profile.bio || 'No bio added yet.'}</p>
      </div>

      {/* Fitness Goals */}
      {profile.fitness_goals.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-lg mb-2">Fitness Goals</h3>
          <div className="flex flex-wrap gap-2">
            {profile.fitness_goals.map((goal) => (
              <span
                key={goal}
                className="px-3 py-1.5 bg-signal/10 text-signal rounded-xl font-data text-sm font-medium capitalize"
              >
                {goal.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {profile.interests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-lg mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 bg-black/5 rounded-xl font-data text-sm capitalize"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {Object.keys(profile.availability || {}).length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-lg mb-2">Availability</h3>
          <div className="grid grid-cols-7 gap-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="text-center">
                <div className="font-data text-xs text-black/60 capitalize">{day.slice(0, 3)}</div>
                {profile.availability[day] && profile.availability[day].length > 0 ? (
                  <div className="w-2 h-2 bg-signal rounded-full mx-auto mt-1" />
                ) : (
                  <div className="w-2 h-2 bg-black/10 rounded-full mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gym Preferences */}
      {profile.gym_preferences.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-lg mb-2">Preferred Gyms</h3>
          <div className="space-y-2">
            {profile.gym_preferences.map((gym) => (
              <div key={gym} className="flex items-center gap-2 font-data text-sm">
                <MapPin className="w-4 h-4 text-signal" />
                {gym}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function EditMode({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}) {
  const goals = ['strength', 'cardio', 'weight_loss', 'muscle_gain', 'flexibility', 'endurance', 'sports_performance'];
  const interests = ['weightlifting', 'cardio', 'yoga', 'pilates', 'crossfit', 'running', 'cycling', 'swimming'];
  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];

  const toggleGoal = (goal: string) => {
    setProfile({
      ...profile,
      fitness_goals: profile.fitness_goals.includes(goal)
        ? profile.fitness_goals.filter((g) => g !== goal)
        : [...profile.fitness_goals, goal],
    });
  };

  const toggleInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.includes(interest)
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest],
    });
  };

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div>
        <label className="block font-data text-sm font-medium mb-2">BIO</label>
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-black rounded-xl font-heading resize-none"
          placeholder="Tell others about your fitness journey..."
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block font-data text-sm font-medium mb-2">GENDER</label>
        <select
          value={profile.gender || 'N'}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
          className="w-full px-4 py-3 border border-black rounded-xl font-heading bg-white"
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
          <option value="N">Prefer not to say</option>
        </select>
      </div>

      {/* Fitness Level */}
      <div>
        <label className="block font-data text-sm font-medium mb-2">FITNESS LEVEL</label>
        <select
          value={profile.fitness_level}
          onChange={(e) => setProfile({ ...profile, fitness_level: e.target.value as any })}
          className="w-full px-4 py-3 border border-black rounded-xl font-heading bg-white"
        >
          {fitnessLevels.map((level) => (
            <option key={level} value={level} className="capitalize">
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Fitness Goals */}
      <div>
        <label className="block font-data text-sm font-medium mb-2">FITNESS GOALS</label>
        <div className="flex flex-wrap gap-2">
          {goals.map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`px-3 py-2 rounded-xl font-data text-sm font-medium transition-colors ${
                profile.fitness_goals.includes(goal)
                  ? 'bg-signal text-white'
                  : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              {goal.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block font-data text-sm font-medium mb-2">INTERESTS</label>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-2 rounded-xl font-data text-sm font-medium transition-colors ${
                profile.interests.includes(interest)
                  ? 'bg-signal text-white'
                  : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-black rounded-2xl p-4 text-center">
      <p className="font-heading font-bold text-2xl">{value}</p>
      <p className="font-data text-xs text-black/60">{label}</p>
    </div>
  );
}
