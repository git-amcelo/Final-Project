'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userApi, ratingApi } from '@/lib/api';
import { ArrowLeft, Mail, Calendar, Star, Ban, XCircle, Trophy, UserMinus, UserPlus } from 'lucide-react';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [profile, setProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [blockId, setBlockId] = useState<number | null>(null);
  
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  const currentUser = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}');
  const currentUserId = currentUser.id;
  const isOwnProfile = profile ? currentUserId === profile.user_id : false;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await userApi.getPublicProfile(userId);
      setProfile(data);
      
      if (currentUserId !== data.user_id) {
        const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updatedHistory = history.filter((h: any) => h.user_id !== data.user_id);
        updatedHistory.unshift({
          user_id: data.user_id,
          username: data.username,
          profile_picture_url: data.profile_picture_url,
          fitness_level: data.fitness_level,
          fitness_goals: data.fitness_goals,
        });
        localStorage.setItem('recentlyViewed', JSON.stringify(updatedHistory.slice(0, 5)));
      }
      
      // Fetch favorites and blocked status
      const [favorites, blocked] = await Promise.all([
        userApi.getFavorites(),
        userApi.getBlocked()
      ]);
      
      const favList = favorites.results || favorites;
      const fav = favList.find((f: any) => f.favorite === data.user_id);
      if (fav) {
        setIsFavorite(true);
        setFavoriteId(fav.id);
      }
      
      const blockedList = blocked.results || blocked;
      const blockRecord = blockedList.find((b: any) => b.blocked === data.user_id);
      if (blockRecord) {
        setIsBlocked(true);
        setBlockId(blockRecord.id);
      }
      
      fetchRatings(data.user_id);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (targetUserId: number) => {
    try {
      const [receivedRes, givenRes] = await Promise.all([
        ratingApi.listRatings({ user_id: String(targetUserId) }),
        ratingApi.listRatings({ from_user_id: String(targetUserId) })
      ]);
      setReviewsReceived(receivedRes.results || receivedRes);
      setReviewsGiven(givenRes.results || givenRes);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    }
  };

  const handleAddFavorite = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await userApi.addFavorite(profile.user_id);
      setIsFavorite(true);
      setFavoriteId(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to add favorite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFavorite = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      let fId = favoriteId;
      if (!fId) {
        const res = await userApi.getFavorites();
        const favorites = res.results || res;
        const fav = favorites.find((f: any) => f.favorite === profile.user_id);
        if (fav) fId = fav.id;
      }
      
      if (fId) {
        await userApi.removeFavorite(fId);
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove favorite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    if (!confirm('Are you sure you want to block this user?')) return;

    setActionLoading(true);
    try {
      const res = await userApi.blockUser(profile.user_id);
      setIsBlocked(true);
      setBlockId(res.id);
      
      // If they were a favorite, block automatically breaks that in some flows, 
      // but let's just make sure UI respects it
      if (isFavorite) {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      let bId = blockId;
      if (!bId) {
        const res = await userApi.getBlocked();
        const blocked = res.results || res;
        const blockRecord = blocked.find((b: any) => b.blocked === profile.user_id);
        if (blockRecord) bId = blockRecord.id;
      }
      
      if (bId) {
        await userApi.unblockUser(bId);
        setIsBlocked(false);
        setBlockId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unblock user');
    } finally {
      setActionLoading(false);
    }
  };



  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-data text-lg text-gray-500">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="font-heading font-bold text-3xl mb-3">Error</h2>
            <p className="font-data text-lg text-gray-600 mb-6">{error || 'Profile not found'}</p>
            <button
              onClick={() => router.back()}
              className="btn-magnetic bg-signal text-white px-8 py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center gap-3"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-base transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <h1 className="font-heading font-bold text-5xl">
              {profile.username}'s
              <span className="font-drama italic text-signal"> Profile</span>
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left Column - Profile Card */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.username}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-6"
                  />
                ) : (
                  <div className="w-32 h-32 bg-signal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="font-heading font-bold text-5xl text-signal">
                      {profile.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                <h2 className="font-heading font-bold text-3xl mb-2">{profile.username}</h2>

                {profile.first_name || profile.last_name ? (
                  <p className="font-data text-lg text-gray-600 mb-6">
                    {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                  </p>
                ) : null}

                {/* Rating */}
                {profile.total_ratings > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-gray-100">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="font-data text-2xl font-bold">{profile.average_rating.toFixed(1)}</span>
                    <span className="font-data text-base text-gray-500">
                      ({profile.total_ratings} {profile.total_ratings === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                )}

                {/* Actions */}
                {!isOwnProfile && !isBlocked && (
                  <div className="flex gap-3">
                    {isFavorite ? (
                      <button
                        onClick={handleRemoveFavorite}
                        disabled={actionLoading}
                        className="flex-1 py-3 px-5 border border-gray-300 rounded-2xl font-data text-base font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <UserMinus className="w-5 h-5" />
                        Remove Favorite
                      </button>
                    ) : (
                      <button
                        onClick={handleAddFavorite}
                        disabled={actionLoading}
                        className="flex-1 py-3 px-5 bg-signal text-white rounded-2xl font-data text-base font-semibold inline-flex items-center justify-center gap-2 shadow-md"
                      >
                        <UserPlus className="w-5 h-5" />
                        Add Favorite
                      </button>
                    )}
                    <button
                      onClick={handleBlock}
                      disabled={actionLoading}
                      className="py-3 px-4 border border-red-300 text-red-600 rounded-2xl font-data text-base font-semibold hover:bg-red-50 inline-flex items-center justify-center transition-colors"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {isBlocked && (
                  <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-3 items-center">
                    <p className="font-data text-base text-red-700 font-medium">You have blocked this user</p>
                    <button
                      onClick={handleUnblock}
                      disabled={actionLoading}
                      className="py-2 px-4 bg-white border border-red-300 text-red-600 rounded-xl font-data text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Unblock User
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading font-bold text-xl mb-6 flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-signal" />
                  Stats
                </h3>

                <div className="space-y-4 font-data text-base">
                  <StatRow label="Joined" value={new Date(profile.joined_date).toLocaleDateString()} />
                  {profile.fitness_level && (
                    <StatRow label="Fitness Level" value={profile.fitness_level} capitalize />
                  )}
                  {profile.total_workouts !== undefined && (
                    <StatRow label="Workouts" value={profile.total_workouts.toString()} />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Details & Reviews */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              {profile.bio && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h3 className="font-heading font-bold text-2xl mb-6">About</h3>
                  <p className="font-data text-lg text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Fitness Goals */}
              {profile.fitness_goals && profile.fitness_goals.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h3 className="font-heading font-bold text-2xl mb-6">Fitness Goals</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.fitness_goals.map((goal: string) => (
                      <span
                        key={goal}
                        className="px-5 py-3 bg-signal/10 text-signal rounded-xl font-data text-base font-semibold capitalize"
                      >
                        {goal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h3 className="font-heading font-bold text-2xl mb-6">Interests</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.interests.map((interest: string) => (
                      <span
                        key={interest}
                        className="px-5 py-3 bg-gray-100 rounded-xl font-data text-base font-medium capitalize"
                      >
                        {interest.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h3 className="font-heading font-bold text-2xl mb-6">Certifications</h3>
                  <div className="space-y-3">
                    {profile.certifications.map((cert: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-signal text-xl">✓</span>
                        <span className="font-data text-base font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings Tabs */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-6 border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-4 font-heading font-bold text-xl transition-colors relative ${
                      activeTab === 'received' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Reviews Received ({reviewsReceived.length})
                    {activeTab === 'received' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-signal rounded-t-full" />
                    )}
                  </button>
                    <button
                      onClick={() => setActiveTab('given')}
                      className={`pb-4 font-heading font-bold text-xl transition-colors relative ${
                        activeTab === 'given' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Reviews Given ({reviewsGiven.length})
                      {activeTab === 'given' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-signal rounded-t-full" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-5">
                    {(activeTab === 'received' ? reviewsReceived : reviewsGiven).slice(0, 10).map((rating) => (
                      <div key={rating.id} className="p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-data text-lg font-semibold">
                              {activeTab === 'received' ? rating.from_user_name : rating.to_user_name}
                            </span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < rating.score
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="font-data text-sm text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="font-data text-base text-gray-700 leading-relaxed">{rating.comment}</p>
                        )}
                        {rating.session_title && (
                          <p className="font-data text-sm text-gray-400 mt-2 flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            Workout: {rating.session_title}
                          </p>
                        )}
                      </div>
                    ))}
                    {(activeTab === 'received' ? reviewsReceived : reviewsGiven).length === 0 && (
                      <p className="font-data text-gray-500 text-center py-4">No reviews to show yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/* Error Message */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-500 text-white px-8 py-4 rounded-2xl shadow-xl font-data text-base font-medium">
            {error}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function StatRow({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-500 font-medium">{label}:</span>
      <span className={`font-semibold ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}
