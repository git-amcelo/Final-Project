'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { groupApi, userApi } from '@/lib/api';
import { WorkoutGroup } from '@/types';
import {
  Users,
  Target,
  ArrowLeft,
  UserPlus,
  UserCheck,
  LogOut,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  UserMinus,
} from 'lucide-react';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = useState<WorkoutGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [slug]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const data = await groupApi.getGroup(slug);
      setGroup(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await groupApi.joinGroup(slug, joinMessage || undefined);
      await fetchGroup();
    } catch (err: any) {
      setError(err.message || 'Failed to join group');
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    setActionLoading(true);
    try {
      await groupApi.leaveGroup(slug);
      await fetchGroup();
    } catch (err: any) {
      setError(err.message || 'Failed to leave group');
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    setActionLoading(true);
    try {
      await groupApi.deleteGroup(slug);
      router.push('/groups');
    } catch (err: any) {
      setError(err.message || 'Failed to delete group');
      setActionLoading(false);
    }
  };

  const handleApproveMember = async (userId: number) => {
    setActionLoading(true);
    try {
      await groupApi.approveMember(slug, userId);
      await fetchGroup();
    } catch (err: any) {
      setError(err.message || 'Failed to approve member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMember = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    setActionLoading(true);
    try {
      await groupApi.removeMember(slug, userId);
      await fetchGroup();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
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
            <p className="font-data text-lg text-gray-500">Loading group...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="font-heading font-bold text-3xl mb-3">Error</h2>
            <p className="font-data text-lg text-gray-600 mb-6">{error || 'Group not found'}</p>
            <button
              onClick={() => router.push('/groups')}
              className="btn-magnetic bg-signal text-white px-8 py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center gap-3"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentUser = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}');
  const currentUserId = currentUser.id;
  const isMember = group.is_member;
  const isCreator = group.is_creator;

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
              Back to Groups
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="font-heading font-bold text-5xl">{group.name}</h1>
                  {group.is_private && (
                    <span className="px-4 py-2 bg-gray-100 rounded-2xl font-data text-sm font-semibold text-gray-600">
                      Private
                    </span>
                  )}
                </div>
                <p className="font-data text-lg text-gray-600 leading-relaxed max-w-2xl">{group.description}</p>
              </div>

              {isCreator && (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/groups/${slug}/edit`)}
                    className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="p-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Group Details */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="font-heading font-bold text-2xl mb-8">About This Group</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <DetailItem icon={<Users className="w-6 h-6" />} label="Members">
                    <span className="font-data text-base font-medium">
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                      {group.max_members && <span className="text-gray-500"> / {group.max_members} max</span>}
                    </span>
                  </DetailItem>

                  {group.location && (
                    <DetailItem icon={<MapPin className="w-6 h-6" />} label="Location">
                      <span className="font-data text-base font-medium">{group.location}</span>
                    </DetailItem>
                  )}

                  <DetailItem icon={<Target className="w-6 h-6" />} label="Skill Level">
                    <span className="font-data text-base font-medium capitalize">{group.skill_level}</span>
                  </DetailItem>

                  <DetailItem icon={<Calendar className="w-6 h-6" />} label="Created">
                    <span className="font-data text-base font-medium">
                      {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </DetailItem>
                </div>

                {group.focus_areas && group.focus_areas.length > 0 && (
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-data text-base font-semibold mb-4">Focus Areas</h3>
                    <div className="flex flex-wrap gap-3">
                      {group.focus_areas.map(area => (
                        <span
                          key={area}
                          className="px-4 py-2 bg-gray-100 rounded-xl font-data text-base font-medium capitalize"
                        >
                          {area.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {group.interests && group.interests.length > 0 && (
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-data text-base font-semibold mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-3">
                      {group.interests.map(interest => (
                        <span
                          key={interest}
                          className="px-4 py-2 bg-signal/10 text-signal rounded-xl font-data text-base font-semibold capitalize"
                        >
                          {interest.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                  <Users className="w-6 h-6 text-signal" />
                  Members ({group.members_list?.filter((m: any) => m.status === 'active').length || 0})
                </h2>

                <div className="space-y-4">
                  {group.members_list?.filter((m: any) => m.status === 'active').map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {member.user_profile?.profile_picture_url ? (
                          <img
                            src={member.user_profile.profile_picture_url}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-signal/10 rounded-full flex items-center justify-center">
                            <Users className="w-7 h-7 text-signal/40" />
                          </div>
                        )}
                        <div>
                          <div className="font-data text-lg font-medium">{member.username}</div>
                          {member.role === 'admin' && (
                            <div className="font-data text-sm text-gray-500 font-medium">Creator</div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/profile/${member.user}`)}
                        className="px-4 py-2 bg-signal/10 text-signal rounded-xl font-data text-sm font-semibold hover:bg-signal/20 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  )) || (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-data text-base text-gray-500">No members yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Membership Requests (Visible only to creator/admin) */}
              {isCreator && group.members_list && group.members_list.filter((m: any) => m.status === 'pending').length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-signal" />
                    Membership Requests
                    <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800 rounded-xl font-data text-sm font-semibold">
                      {group.members_list.filter((m: any) => m.status === 'pending').length} pending
                    </span>
                  </h2>

                  <div className="space-y-4">
                    {group.members_list.filter((m: any) => m.status === 'pending').map((member: any) => (
                      <div
                        key={member.id}
                        className="flex flex-col p-5 bg-yellow-50 border border-yellow-200 rounded-2xl gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {member.user_profile?.profile_picture_url ? (
                              <img
                                src={member.user_profile.profile_picture_url}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-signal/10 rounded-full flex items-center justify-center">
                                <Users className="w-7 h-7 text-signal/40" />
                              </div>
                            )}
                            <div>
                              <div className="font-data text-lg font-medium">{member.username}</div>
                              <div className="font-data text-xs text-gray-400">
                                Requested {new Date(member.joined_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveMember(member.user)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-data text-sm font-semibold inline-flex items-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectMember(member.user)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-data text-sm font-semibold inline-flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>

                        {member.message && (
                          <div className="bg-white/80 p-3 rounded-xl border border-yellow-100">
                            <p className="font-data text-sm text-gray-700 italic">"{member.message}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Join/Leave Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading font-bold text-xl mb-6">
                  {isMember ? 'Your Membership' : 'Join This Group'}
                </h3>

                {isMember ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-green-50 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <p className="font-data text-base text-green-700 font-medium">
                          You are a member of this group
                        </p>
                      </div>
                    </div>
                    {!isCreator && (
                      <button
                        onClick={handleLeave}
                        disabled={actionLoading}
                        className="w-full py-4 rounded-2xl font-heading font-semibold text-base border border-gray-300 hover:bg-gray-50 inline-flex items-center justify-center gap-3 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Leave Group
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {group.is_private && (
                      <div>
                        <label className="block font-data text-base font-semibold mb-3">
                          Message to the group creator
                        </label>
                        <textarea
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                          rows={4}
                          placeholder="Introduce yourself and explain why you'd like to join..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl font-data text-base resize-none focus:outline-none focus:ring-2 focus:ring-signal/50 transition-shadow"
                        />
                      </div>
                    )}
                    <button
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="w-full btn-magnetic bg-signal text-white py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
                    >
                      <UserPlus className="w-5 h-5" />
                      {actionLoading ? 'Joining...' : group.is_private ? 'Request to Join' : 'Join Group'}
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Workouts */}
              {group.upcoming_sessions && group.upcoming_sessions.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <h3 className="font-heading font-bold text-xl mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-signal" />
                    Upcoming Workouts
                  </h3>

                  <div className="space-y-3">
                    {group.upcoming_sessions.slice(0, 3).map((workout: any) => (
                      <div
                        key={workout.id}
                        className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => router.push(`/workouts/${workout.id}`)}
                      >
                        <div className="font-data text-lg font-medium mb-1">{workout.title}</div>
                        <div className="font-data text-sm text-gray-500">
                          {new Date(workout.scheduled_datetime).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push(`/groups/${slug}/sessions`)}
                    className="w-full mt-5 py-3 font-data text-base text-signal hover:underline font-medium"
                  >
                    View all workouts →
                  </button>
                </div>
              )}
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
