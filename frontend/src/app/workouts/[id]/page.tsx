'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { workoutApi, ratingApi, userApi } from '@/lib/api';
import { Workout } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Target,
  ArrowLeft,
  UserCheck,
  UserX,
  LogOut,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  UserPlus,
  Star,
} from 'lucide-react';

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = parseInt(params.id as string);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    const user = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}');
    setCurrentUser(user);
    fetchWorkout(user);
  }, [sessionId]);

  const fetchWorkout = async (user?: any) => {
    setLoading(true);
    setError('');
    try {
      const data = await workoutApi.getWorkout(sessionId);

      // Validate that we have the required data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid workout data received');
      }
      if (!data.id) {
        throw new Error('Workout data missing required fields');
      }

      setWorkout(data);

      // Check if user has already rated this session
      const u = user || currentUser;
      if (u && u.id) {
        const ratings = await ratingApi.getWorkoutRatings(sessionId);
        const rated = (ratings.results || ratings).find((r: any) => r.from_user === u.id);
        if (rated) {
          setHasRated(true);
        }

        if (data.creator === u.id) {
          try {
            const blockedRes = await userApi.getBlocked();
            setBlockedUsers(blockedRes.results || blockedRes);
          } catch (e) {
            console.error('Failed to fetch blocked users:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load workout:', err);
      setError(err.message || 'Failed to load workout');
      setWorkout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    setActionLoading(true);
    try {
      await workoutApi.requestToJoin(sessionId);
      await fetchWorkout();
    } catch (err: any) {
      setError(err.message || 'Failed to request to join');
      setActionLoading(false);
    }
  };

  const handleAcceptParticipant = async (userId: number | null) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await workoutApi.acceptParticipant(sessionId, userId);
      await fetchWorkout();
    } catch (err: any) {
      setError(err.message || 'Failed to accept participant');
      setActionLoading(false);
    }
  };

  const handleRejectParticipant = async (userId: number | null) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await workoutApi.rejectParticipant(sessionId, userId);
      await fetchWorkout();
    } catch (err: any) {
      setError(err.message || 'Failed to reject participant');
      setActionLoading(false);
    }
  };

  const handleLeaveWorkout = async () => {
    if (!confirm('Are you sure you want to leave this workout?')) return;

    setActionLoading(true);
    try {
      await workoutApi.leaveWorkout(sessionId);
      router.push('/workouts');
    } catch (err: any) {
      setError(err.message || 'Failed to leave workout');
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    setActionLoading(true);
    try {
      await workoutApi.deleteWorkout(sessionId);
      router.push('/workouts');
    } catch (err: any) {
      setError(err.message || 'Failed to delete workout');
      setActionLoading(false);
    }
  };
  const handleSubmitReview = async () => {
    if (!workout) return;
    setSubmittingReview(true);
    try {
      // Determine partner ID
      let partnerId = null;
      if (workout.session_type === '1on1') {
        if (workout.is_creator && workout.participant) {
          partnerId = workout.participant;
        } else if (workout.is_participant && workout.creator) {
          partnerId = workout.creator;
        }
      } else {
        // Just fail gracefully if group logic isn't handled yet
        throw new Error("Cannot rate group sessions yet");
      }

      await ratingApi.rateWorkoutPartner(sessionId, {
        score: reviewScore,
        comment: reviewComment,
        to_user_id: partnerId
      });

      setShowReviewModal(false);
      setHasRated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-data text-lg text-gray-500">Loading workout...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !workout) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="font-heading font-bold text-3xl mb-3">Error</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                <p className="font-data text-sm text-red-700 break-words">{error}</p>
              </div>
            )}
            {!error && (
              <p className="font-data text-lg text-gray-600 mb-6">Workout not found</p>
            )}
            <button
              onClick={() => router.push('/workouts')}
              className="btn-magnetic bg-signal text-white px-8 py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center gap-3"
            >
              Back to Workouts
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const date = workout.scheduled_datetime ? new Date(workout.scheduled_datetime) : new Date();
  const isCreator = workout.is_creator ?? false;
  const isParticipant = workout.is_participant ?? false;
  const isPast = workout.is_past ?? false;

  const getStatusColor = (status: string) => {
    const validStatuses = ['accepted', 'pending', 'completed', 'cancelled', 'available', 'rejected'];
    const normalizedStatus = validStatuses.includes(status) ? status : 'available';

    switch (normalizedStatus) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'available':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              Back to Workouts
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="font-heading font-bold text-5xl mb-4">{workout.title}</h1>
                <p className="font-data text-lg text-gray-600 leading-relaxed max-w-2xl">{workout.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-5 py-2 rounded-2xl font-data text-base font-semibold ${getStatusColor(workout.status)}`}
                >
                  {workout.status}
                </span>
                {isPast && (
                  <span className="px-4 py-2 bg-gray-100 rounded-2xl font-data text-base text-gray-600 font-medium">
                    Past
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Workout Details */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="font-heading font-bold text-2xl mb-8">Workout Details</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <DetailItem icon={<Calendar className="w-6 h-6" />} label="Date & Time">
                    <div className="font-data text-base">
                      <div className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div className="text-gray-500">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </DetailItem>

                  <DetailItem icon={<Clock className="w-6 h-6" />} label="Duration">
                    <span className="font-data text-base font-medium">{workout.duration_minutes || 60} minutes</span>
                  </DetailItem>

                  <DetailItem icon={<MapPin className="w-6 h-6" />} label="Location">
                    <span className="font-data text-base font-medium">{workout.location || 'TBD'}</span>
                  </DetailItem>

                  <DetailItem icon={<Target className="w-6 h-6" />} label="Level & Type">
                    <div className="font-data text-base">
                      <div className="font-medium capitalize">{workout.skill_level || 'Any'} Level</div>
                      <div className="text-gray-500 capitalize">{workout.workout_type || 'Workout'}</div>
                    </div>
                  </DetailItem>
                </div>

                {workout.focus_areas && workout.focus_areas.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="font-data text-base font-semibold mb-4">Focus Areas</h3>
                    <div className="flex flex-wrap gap-3">
                      {workout.focus_areas.map((area, idx) => (
                        <span
                          key={area || idx}
                          className="px-4 py-2 bg-signal/10 text-signal rounded-xl font-data text-base font-medium capitalize"
                        >
                          {area.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                  <Users className="w-6 h-6 text-signal" />
                  Participants
                </h2>

                <div className="space-y-4">
                  {/* Creator */}
                  <ParticipantCard
                    name={workout.creator_name}
                    role="Creator"
                    roleColor="green"
                    picture={workout.creator_profile?.profile_picture_url || undefined}
                  />

                  {/* Participant */}
                  {workout.participant && (
                    <ParticipantCard
                      name={workout.participant_name || 'Participant'}
                      role="Participant"
                      picture={workout.participant_profile?.profile_picture_url || undefined}
                      actions={
                        isCreator && workout.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => workout.participant && handleAcceptParticipant(workout.participant)}
                              disabled={actionLoading}
                              className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => workout.participant && handleRejectParticipant(workout.participant)}
                              disabled={actionLoading}
                              className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                            >
                              <UserX className="w-5 h-5" />
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  )}

                  {!workout.participant && workout.status !== 'completed' && (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-data text-base text-gray-500">No participants yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Requests - visible to creator only, only pending requests */}
              {isCreator && workout.join_requests && workout.join_requests.filter((r: any) => r.status === 'pending').length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-signal" />
                    Join Requests
                    <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800 rounded-xl font-data text-sm font-semibold">
                      {workout.join_requests.filter((r: any) => r.status === 'pending').length} pending
                    </span>
                  </h2>

                  <div className="space-y-4">
                    {workout.join_requests.filter((r: any) => r.status === 'pending').map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-5 rounded-2xl bg-yellow-50 border border-yellow-200"
                      >
                        <div className="flex items-center gap-4">
                          {request.requester_profile?.profile_picture_url ? (
                            <img src={request.requester_profile.profile_picture_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 bg-signal/10 rounded-full flex items-center justify-center">
                              <Users className="w-7 h-7 text-signal/40" />
                            </div>
                          )}
                          <div>
                            <div className="font-data text-lg font-medium flex items-center gap-2">
                              {request.requester_username}
                              {blockedUsers.some(b => b.blocked === request.requester) && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">
                                  Blocked
                                </span>
                              )}
                            </div>
                            {request.message && (
                              <div className="flex items-center gap-1 mt-1">
                                <MessageSquare className="w-3 h-3 text-gray-400" />
                                <span className="font-data text-sm text-gray-500">{request.message}</span>
                              </div>
                            )}
                            <div className="font-data text-xs text-gray-400 mt-1">
                              {new Date(request.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAcceptParticipant(request.requester)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-data text-sm font-semibold inline-flex items-center gap-2"
                          >
                            <UserCheck className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectParticipant(request.requester)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-data text-sm font-semibold inline-flex items-center gap-2"
                          >
                            <UserX className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading font-bold text-xl mb-6">Actions</h3>

                <div className="space-y-3">
                  {isCreator && !isPast && workout.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => router.push(`/workouts/${sessionId}/edit`)}
                        className="w-full btn-magnetic bg-signal text-white py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center justify-center gap-3 shadow-md"
                      >
                        <Edit className="w-5 h-5" />
                        Edit Workout
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="w-full py-4 rounded-2xl font-heading font-semibold text-base border border-red-300 text-red-600 hover:bg-red-50 inline-flex items-center justify-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Workout
                      </button>
                    </>
                  )}

                  {isParticipant && !isPast && workout.status !== 'completed' && (
                    <button
                      onClick={handleLeaveWorkout}
                      disabled={actionLoading}
                      className="w-full py-4 rounded-2xl font-heading font-semibold text-base border border-gray-300 hover:bg-gray-50 inline-flex items-center justify-center gap-3 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Leave Workout
                    </button>
                  )}

                  {!isCreator && !isParticipant && !isPast && workout.status !== 'completed' && (
                    <button
                      onClick={handleJoinRequest}
                      disabled={actionLoading || workout.has_pending_request || (workout.status === 'accepted' && workout.participant !== null)}
                      className="w-full btn-magnetic bg-signal text-white py-4 rounded-2xl font-heading font-semibold text-base disabled:opacity-50 shadow-md"
                    >
                      {workout.has_pending_request
                        ? 'Pending Approval'
                        : workout.status === 'accepted' && workout.participant !== null
                        ? 'Workout Full'
                        : 'Request to Join'}
                    </button>
                  )}

                  {(isPast || workout.status === 'completed') && (isCreator || isParticipant) && workout.participant && !hasRated && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full py-4 rounded-2xl font-heading font-semibold text-base border border-signal text-signal hover:bg-signal/5 inline-flex items-center justify-center gap-3 transition-colors"
                    >
                      <Star className="w-5 h-5" />
                      Rate Partner
                    </button>
                  )}
                  {(isPast || workout.status === 'completed') && hasRated && (
                    <div className="w-full py-4 rounded-2xl font-heading font-semibold text-base bg-green-50 text-green-600 border border-green-200 inline-flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      Partner Rated
                    </div>
                  )}
                </div>
              </div>

              {/* Workout Info */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading font-bold text-xl mb-6">Workout Info</h3>

                <div className="space-y-4 font-data text-base">
                  <InfoRow label="Status" value={workout.status || 'Unknown'} />
                  <InfoRow label="Type" value={workout.workout_type || '1on1'} />
                  <InfoRow label="Skill Level" value={workout.skill_level || 'Any'} />
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-heading font-bold text-2xl">Rate Workout Partner</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block font-data text-sm font-medium text-gray-700 mb-2">Score</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewScore(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewScore ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-data text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-signal/30 font-data resize-none"
                  placeholder="Share your experience working out with this partner..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2.5 rounded-xl font-data font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-6 py-2.5 rounded-xl font-data font-semibold bg-signal text-white hover:bg-signal/90 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}

function DetailItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
      <div className="p-2 bg-signal/10 rounded-xl text-signal shrink-0">{icon}</div>
      <div>
        <div className="font-data text-sm text-gray-500 mb-1">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function ParticipantCard({
  name,
  role,
  roleColor = 'blue',
  picture,
  actions,
}: {
  name: string;
  role: string;
  roleColor?: string;
  picture?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-4">
        {picture ? (
          <img src={picture} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 bg-signal/10 rounded-full flex items-center justify-center">
            <Users className="w-7 h-7 text-signal/40" />
          </div>
        )}
        <div>
          <div className="font-data text-lg font-medium">{name}</div>
          <div className="font-data text-sm text-gray-500">{role}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <span className={`px-3 py-1 bg-${roleColor}-100 text-${roleColor}-800 rounded-xl font-data text-sm font-semibold capitalize`}>
          {role}
        </span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}
