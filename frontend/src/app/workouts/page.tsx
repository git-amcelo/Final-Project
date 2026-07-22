'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { workoutApi } from '@/lib/api';
import { Workout } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  ChevronDown,
} from 'lucide-react';

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [myWorkouts, setMyWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'available'>('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');

  const LOCATIONS = [
    'Main Campus Gym',
    'Recreation Center',
    'Stadium',
    'Outdoor Track',
    'Fitness Studio',
    'Pool',
  ];

  useEffect(() => {
    fetchWorkouts();
  }, [filter]);

  const fetchWorkouts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (filter === 'my') {
        const data = await workoutApi.getMyWorkouts();
        setMyWorkouts(data.results || data);
        setWorkouts([]);
      } else if (filter === 'available') {
        const params: Record<string, string> = {};
        if (locationSearch) params.location = locationSearch;
        if (keyword) params.search = keyword;
        if (sessionTypeFilter) params.session_type = sessionTypeFilter;
        if (intensityFilter) params.intensity = intensityFilter;
        const data = await workoutApi.getAvailableWorkouts(Object.keys(params).length ? params : undefined);
        setWorkouts(data.results || data);
        setMyWorkouts([]);
      } else {
        const params: Record<string, string> = {};
        if (keyword || locationSearch) params.search = keyword || locationSearch;
        if (sessionTypeFilter) params.session_type = sessionTypeFilter;
        if (intensityFilter) params.intensity = intensityFilter;
        const data = await workoutApi.listWorkouts(Object.keys(params).length ? params : undefined);
        setWorkouts(data.results || data);
        setMyWorkouts([]);
      }
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const workoutsList = filter === 'my' ? myWorkouts : workouts;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        {/* Header */}
        <div className="bg-paper border-b border-black">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">
                  Workouts
                </h1>
                <p className="font-data text-black/60">
                  Book workouts with compatible fitness partners
                </p>
              </div>
              <button
                onClick={() => router.push('/workouts/new')}
                className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Workout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Filter Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-black/40" />
              <div className="flex gap-2">
                <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
                  All Workouts
                </FilterTab>
                <FilterTab active={filter === 'my'} onClick={() => setFilter('my')}>
                  My Workouts
                </FilterTab>
                <FilterTab active={filter === 'available'} onClick={() => setFilter('available')}>
                  Available to Join
                </FilterTab>
              </div>
            </div>
            
            <form onSubmit={fetchWorkouts} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search title or description..."
                className="px-4 py-2 border border-black rounded-xl font-data text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              />
              <select
                value={sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value)}
                className="px-4 py-2 border border-black rounded-xl font-data text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                <option value="">All Types</option>
                <option value="1on1">One-on-One</option>
                <option value="group">Group</option>
              </select>
              <select
                value={intensityFilter}
                onChange={(e) => setIntensityFilter(e.target.value)}
                className="px-4 py-2 border border-black rounded-xl font-data text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                <option value="">Any Intensity</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
              <select
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="px-4 py-2 border border-black rounded-xl font-data text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 bg-black text-white rounded-xl font-data text-sm font-medium">
                Search
              </button>
            </form>
          </div>

          {/* Workouts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="font-data text-lg">Loading workouts...</div>
            </div>
          ) : workoutsList.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-black/20 mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">
                {filter === 'my' ? 'No workouts yet' : 'No workouts available'}
              </h3>
              <p className="font-data text-black/60 mb-4">
                {filter === 'my'
                  ? 'Create your first workout'
                  : 'Check back later for available workouts'}
              </p>
              {filter === 'my' && (
                <button
                  onClick={() => router.push('/workouts/new')}
                  className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Workout
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workoutsList.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function FilterTab({
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
      className={`px-4 py-2 rounded-xl font-data text-sm font-medium transition-colors ${
        active ? 'bg-signal text-white' : 'bg-white border border-black hover:bg-black/5'
      }`}
    >
      {children}
    </button>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const router = useRouter();
  const date = new Date(workout.scheduled_datetime);
  const isPast = workout.is_past;

  return (
    <div
      onClick={() => router.push(`/workouts/${workout.id}`)}
      className={`bg-white border border-black rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-lg font-data text-xs font-medium ${
            workout.status === 'accepted'
              ? 'bg-green-100 text-green-700'
              : workout.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : workout.status === 'completed'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {workout.status}
        </span>
        {isPast && <span className="font-data text-xs text-black/40">Past</span>}
      </div>

      {/* Title */}
      <h3 className="font-heading font-bold text-xl mb-2">{workout.title}</h3>

      {/* Creator */}
      <div className="flex items-center gap-2 mb-4">
        {workout.creator_profile?.profile_picture_url ? (
          <img
            src={workout.creator_profile.profile_picture_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-signal/10 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-signal/40" />
          </div>
        )}
        <span className="font-data text-sm text-black/60">with {workout.creator_name}</span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 font-data text-sm text-black/70">
          <Calendar className="w-4 h-4 text-signal" />
          {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-2 font-data text-sm text-black/70">
          <Clock className="w-4 h-4 text-signal" />
          {workout.duration_minutes} minutes
        </div>
        <div className="flex items-center gap-2 font-data text-sm text-black/70">
          <MapPin className="w-4 h-4 text-signal" />
          {workout.location}
        </div>
      </div>

      {/* Focus Areas */}
      {workout.focus_areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workout.focus_areas.map((area) => (
            <span
              key={area}
              className="px-2 py-1 bg-black/5 rounded-md font-data text-xs capitalize"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Action Button */}
      {!isPast && workout.status !== 'completed' && (
        <button className="w-full mt-4 btn-magnetic bg-signal text-white py-3 rounded-xl font-data text-sm font-medium">
          {workout.status === 'accepted' ? 'View Details' : workout.session_type === '1on1' && !workout.participant ? 'Request to Join' : 'View Details'}
        </button>
      )}
    </div>
  );
}
