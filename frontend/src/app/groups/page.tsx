'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { groupApi } from '@/lib/api';
import { WorkoutGroup } from '@/types';
import {
  Users,
  Plus,
  Search,
  TrendingUp,
  Calendar,
} from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<WorkoutGroup[]>([]);
  const [myGroups, setMyGroups] = useState<WorkoutGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'explore' | 'my'>('explore');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [view]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      if (view === 'my') {
        const data = await groupApi.getMyGroups();
        setMyGroups(data.results || data);
        setGroups([]);
      } else {
        const data = await groupApi.listGroups();
        setGroups(data.results || data);
        setMyGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedGroups = view === 'my' ? myGroups : groups;
  const filteredGroups = displayedGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        {/* Header */}
        <div className="bg-paper border-b border-black">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">
                  Workout
                  <span className="font-drama italic text-signal"> Groups</span>
                </h1>
                <p className="font-data text-black/60">
                  Join communities and train together
                </p>
              </div>
              <button
                onClick={() => router.push('/groups/new')}
                className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* View Toggle & Search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex gap-2">
              <ViewToggle active={view === 'explore'} onClick={() => setView('explore')}>
                Explore
              </ViewToggle>
              <ViewToggle active={view === 'my'} onClick={() => setView('my')}>
                My Groups
              </ViewToggle>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-3 border border-black rounded-xl font-heading bg-white"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="font-data text-lg">Loading groups...</div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-black/20 mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">
                {view === 'my' ? 'You haven\'t joined any groups' : 'No groups found'}
              </h3>
              <p className="font-data text-black/60 mb-4">
                {view === 'my'
                  ? 'Explore groups to join the community'
                  : 'Be the first to create a group'}
              </p>
              {view === 'explore' && (
                <button
                  onClick={() => router.push('/groups/new')}
                  className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-data text-sm font-medium transition-colors ${
        active ? 'bg-signal text-white' : 'bg-white border border-black hover:bg-black/5'
      }`}
    >
      {children}
    </button>
  );
}

function GroupCard({ group }: { group: WorkoutGroup }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/groups/${group.slug}`)}
      className="bg-white border border-black rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Group Image */}
      {group.group_image_url ? (
        <img
          src={group.group_image_url}
          alt={group.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-signal/20 to-signal/5 flex items-center justify-center">
          <Users className="w-16 h-16 text-signal/30" />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Type Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-lg font-data text-xs font-medium ${
              group.group_type === 'open'
                ? 'bg-green-100 text-green-700'
                : group.group_type === 'closed'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {group.group_type}
          </span>
          {group.is_featured && (
            <span className="flex items-center gap-1 text-amber-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-data text-xs font-medium">Featured</span>
            </span>
          )}
        </div>

        {/* Name & Tagline */}
        <h3 className="font-heading font-bold text-xl mb-1">{group.name}</h3>
        {group.tagline && (
          <p className="font-data text-sm text-black/60 mb-3">{group.tagline}</p>
        )}

        {/* Description */}
        <p className="font-data text-sm text-black/70 line-clamp-2 mb-4">{group.description}</p>

        {/* Details */}
        <div className="flex items-center gap-4 mb-4 font-data text-sm text-black/60">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {group.member_count_actual}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {group.session_count}
          </div>
        </div>

        {/* Focus Areas */}
        {group.focus_areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {group.focus_areas.slice(0, 3).map((area) => (
              <span
                key={area}
                className="px-2 py-1 bg-black/5 rounded-md font-data text-xs"
              >
                {area}
              </span>
            ))}
            {group.focus_areas.length > 3 && (
              <span className="font-data text-xs text-black/40">
                +{group.focus_areas.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <button className="w-full mt-4 btn-magnetic bg-signal text-white py-3 rounded-xl font-data text-sm font-medium">
          {group.is_member ? 'View Group' : group.group_type === 'open' ? 'Join Group' : 'Request to Join'}
        </button>
      </div>
    </div>
  );
}
