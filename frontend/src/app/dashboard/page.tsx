'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userApi, workoutApi, groupApi, matchingApi } from '@/lib/api';
import { UserProfile, Workout, WorkoutGroup } from '@/types';
import {
  Dumbbell,
  Users,
  Calendar,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { authApi } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myWorkouts, setMyWorkouts] = useState<Workout[]>([]);
  const [myGroups, setMyGroups] = useState<WorkoutGroup[]>([]);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    authApi.logout();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, workoutsData, groupsData, matchesData] = await Promise.all([
          userApi.getProfile(),
          workoutApi.getMyWorkouts(),
          groupApi.getMyGroups(),
          matchingApi.getTopMatches(),
        ]);

        setProfile(profileData);
        setMyWorkouts(workoutsData.results || workoutsData);
        setMyGroups(groupsData.results || groupsData);
        setTopMatches(matchesData.matches || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-data text-lg">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        {/* Header */}
        <div className="bg-paper border-b border-black">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-3xl">
                  Welcome back, {profile?.username || 'Athlete'}!
                </h1>
                <p className="font-data text-black/60">
                  {profile?.bio || 'Complete your profile to get better matches.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
                >
                  Edit Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
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

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Star} label="Rating" value={profile?.average_rating.toFixed(1) || '0.0'} />
            <StatCard icon={Users} label="Groups" value={myGroups.length} />
            <StatCard icon={Calendar} label="Workouts" value={myWorkouts.length} />
            <StatCard icon={TrendingUp} label="Streak" value="0 days" />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <QuickActionCard
              icon={Dumbbell}
              title="Find Buddies"
              description="Get matched with compatible fitness partners"
              href="/matching"
              color="bg-blue-50"
            />
            <QuickActionCard
              icon={Calendar}
              title="Book Workout"
              description="Schedule a workout with partners"
              href="/workouts/new"
              color="bg-green-50"
            />
            <QuickActionCard
              icon={Users}
              title="Join Groups"
              description="Connect with fitness communities"
              href="/groups"
              color="bg-purple-50"
            />
          </div>

          {/* Upcoming Workouts */}
          <Section title="Upcoming Workouts" seeAll="/workouts">
            {myWorkouts.length === 0 ? (
              <EmptyState
                message="No upcoming workouts"
                action="Book your first workout"
                link="/workouts/new"
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myWorkouts.slice(0, 4).map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
            )}
          </Section>

          {/* My Groups */}
          <Section title="My Groups" seeAll="/groups" className="mt-8">
            {myGroups.length === 0 ? (
              <EmptyState
                message="You haven't joined any groups"
                action="Explore groups"
                link="/groups"
              />
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {myGroups.slice(0, 3).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </Section>

          {/* Top Matches */}
          {topMatches.length > 0 && (
            <Section title="Recommended Buddies" seeAll="/matching" className="mt-8">
              <div className="grid md:grid-cols-4 gap-4">
                {topMatches.slice(0, 4).map((match) => (
                  <MatchCard key={match.profile.id} match={match} />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white shadow-sm rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-signal/10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-signal" />
        </div>
        <div>
          <p className="font-data text-xs text-black/60">{label}</p>
          <p className="font-heading font-bold text-xl">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="block">
      <div className={`${color} shadow-sm rounded-[2rem] p-6 hover:shadow-lg transition-shadow`}>
        <div className="w-12 h-12 bg-signal rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2">{title}</h3>
        <p className="font-data text-sm text-black/60 mb-4">{description}</p>
        <div className="flex items-center gap-2 text-signal font-data text-sm font-medium">
          Get Started <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function Section({
  title,
  seeAll,
  children,
  className = '',
}: {
  title: string;
  seeAll: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-2xl">{title}</h2>
        <Link href={seeAll} className="font-data text-sm text-signal hover:underline">
          See All →
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message, action, link }: { message: string; action: string; link: string }) {
  return (
    <div className="bg-white shadow-sm rounded-2xl p-8 text-center">
      <p className="font-data text-black/60 mb-4">{message}</p>
      <Link
        href={link}
        className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl font-heading font-medium inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> {action}
      </Link>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const date = new Date(workout.scheduled_datetime);
  return (
    <Link href={`/workouts/${workout.id}`} className="block">
      <div className="bg-white shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-heading font-bold">{workout.title}</h4>
            <p className="font-data text-sm text-black/60">{workout.location}</p>
          </div>
          <span className={`px-2 py-1 rounded-lg font-data text-xs ${
            workout.status === 'accepted' ? 'bg-green-100 text-green-700' :
            workout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {workout.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm font-data text-black/60">
          <span>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{workout.duration_minutes} min</span>
        </div>
      </div>
    </Link>
  );
}

function GroupCard({ group }: { group: WorkoutGroup }) {
  return (
    <Link href={`/groups/${group.slug}`} className="block">
      <div className="bg-white shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          {group.group_image_url ? (
            <img src={group.group_image_url} alt={group.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 bg-signal/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-signal" />
            </div>
          )}
          <div>
            <h4 className="font-heading font-bold">{group.name}</h4>
            <p className="font-data text-sm text-black/60">{group.member_count_actual} members</p>
          </div>
        </div>
        <p className="font-data text-sm text-black/60 line-clamp-2">{group.description}</p>
      </div>
    </Link>
  );
}

function MatchCard({ match }: { match: any }) {
  return (
    <Link href={`/profile/${match.profile.id}`} className="block">
      <div className="bg-white shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow">
        {match.profile.profile_picture_url ? (
          <img src={match.profile.profile_picture_url} alt="" className="w-full aspect-square rounded-xl object-cover mb-3" />
        ) : (
          <div className="w-full aspect-square bg-signal/10 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-12 h-12 text-signal/40" />
          </div>
        )}
        <h4 className="font-heading font-bold truncate">{match.profile.username}</h4>
        <div className="flex items-center justify-between mt-2">
          <span className="font-data text-sm text-black/60">{match.profile.fitness_level}</span>
          <span className="font-data text-sm font-medium text-signal">{match.compatibility_score}% match</span>
        </div>
      </div>
    </Link>
  );
}
