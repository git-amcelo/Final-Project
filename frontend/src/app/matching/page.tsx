'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authApi, matchingApi } from '@/lib/api';
import { MatchResponse, MatchedUser } from '@/types';
import {
  Users,
  SlidersHorizontal,
  Heart,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function MatchingPage() {
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [filters, setFilters] = useState<{
    fitness_level: string;
    gender: string;
    goals: string[];
    location: string;
  }>({
    fitness_level: '',
    gender: '',
    goals: [],
    location: '',
  });

  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
  const goals = ['strength', 'cardio', 'weight_loss', 'muscle_gain', 'flexibility', 'endurance'];
  const LOCATIONS = [
    'Main Campus Gym',
    'Recreation Center',
    'Stadium',
    'Outdoor Track',
    'Fitness Studio',
    'Pool',
  ];

  useEffect(() => {
    findMatches();
    
    // Load history tracking
    const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(history);
  }, []);

  const findMatches = async () => {
    setLoading(true);
    try {
      const response: MatchResponse = await matchingApi.findBuddies(filters);
      setMatches(response.matches || []);
    } catch (error) {
      console.error('Failed to find matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setFilters((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <h1 className="font-heading font-bold text-4xl mb-2">
              Find Your
              <span className="font-drama italic text-signal"> Fitness Buddy</span>
            </h1>
            <p className="font-data text-gray-500">
              Get matched with compatible partners based on your fitness goals
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-72 shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                  <h2 className="font-heading font-bold text-lg">Filters</h2>
                </div>

                <div className="mb-5">
                  <label className="block font-data text-xs font-medium text-gray-500 mb-2">FITNESS LEVEL</label>
                  <select
                    value={filters.fitness_level}
                    onChange={(e) => setFilters({ ...filters, fitness_level: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl font-data text-sm focus:outline-none focus:ring-2 focus:ring-signal/30"
                  >
                    <option value="">Any Level</option>
                    {fitnessLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block font-data text-xs font-medium text-gray-500 mb-2">GENDER</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl font-data text-sm focus:outline-none focus:ring-2 focus:ring-signal/30"
                  >
                    <option value="">Any</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block font-data text-xs font-medium text-gray-500 mb-2">LOCATION</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl font-data text-sm focus:outline-none focus:ring-2 focus:ring-signal/30"
                  >
                    <option value="">Any Location</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block font-data text-xs font-medium text-gray-500 mb-2">GOALS</label>
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-3 py-1.5 rounded-lg font-data text-xs font-medium transition-colors ${
                          filters.goals.includes(goal)
                            ? 'bg-signal text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {goal.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={findMatches}
                  disabled={loading}
                  className="w-full btn-magnetic bg-signal text-white py-3 rounded-xl font-heading font-bold disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Find Buddies'}
                </button>
              </div>
              
              {/* Recently Viewed History */}
              {recentlyViewed.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 mt-6">
                  <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-signal" />
                    Recently Viewed
                  </h3>
                  <div className="space-y-4">
                    {recentlyViewed.map((user, idx) => (
                      <Link key={idx} href={`/profile/${user.user_id}`} className="flex items-center gap-3 group">
                        {user.profile_picture_url ? (
                          <img src={user.profile_picture_url} alt={user.username} className="w-10 h-10 rounded-full object-cover group-hover:ring-2 ring-signal/30 transition-all" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-signal/10 transition-colors">
                            <Users className="w-5 h-5 text-gray-400 group-hover:text-signal transition-colors" />
                          </div>
                        )}
                        <div>
                          <p className="font-heading font-bold text-sm group-hover:text-signal transition-colors">{user.username}</p>
                          <p className="font-data text-xs text-gray-500 capitalize">{user.fitness_level}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="font-data text-gray-500">Finding compatible buddies...</div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-heading font-bold text-xl mb-2">No matches found</h3>
                  <p className="font-data text-gray-500">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-data text-gray-500 mb-6">
                    Found <span className="font-bold text-gray-900">{matches.length}</span> compatible buddies
                  </p>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {matches.map((match) => (
                      <MatchCard key={match.profile.id} match={match} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MatchCard({ match }: { match: MatchedUser }) {
  const profile = match.profile;
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/profile/${profile.id}`)}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-3">
        {profile.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt={profile.username}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 bg-signal/10 rounded-full flex items-center justify-center">
            <Users className="w-7 h-7 text-signal/40" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base truncate">{profile.username}</h3>
          <p className="font-data text-sm text-gray-500 capitalize">{profile.fitness_level}</p>
        </div>

        <div className="bg-signal/10 px-3 py-1.5 rounded-full">
          <span className="font-data text-sm font-bold text-signal">
            {match.compatibility_score}%
          </span>
        </div>
      </div>

      {profile.bio && (
        <p className="font-data text-sm text-gray-600 line-clamp-2 mb-3">{profile.bio}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {profile.fitness_goals.slice(0, 3).map((goal) => (
          <span
            key={goal}
            className="px-2.5 py-1 bg-gray-100 rounded-lg font-data text-xs text-gray-600 capitalize"
          >
            {goal.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
