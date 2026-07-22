'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { workoutApi } from '@/lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Target,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';

const FOCUS_AREAS = [
  'strength',
  'cardio',
  'flexibility',
  'endurance',
  'weight_loss',
  'muscle_gain',
  'sports_performance',
];

const LOCATIONS = [
  'Main Campus Gym',
  'Recreation Center',
  'Stadium',
  'Outdoor Track',
  'Fitness Studio',
  'Pool',
];

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = parseInt(params.id as string);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_datetime: '',
    duration_minutes: 60,
    location: '',
    max_participants: 1,
    workout_type: '1on1',
    focus_areas: [] as string[],
    skill_level: 'intermediate',
  });

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await workoutApi.getWorkout(sessionId);

        // Check if user is the creator
        if (!data.is_creator) {
          router.push(`/workouts/${sessionId}`);
          return;
        }

        // Format datetime for input
        const dt = new Date(data.scheduled_datetime);
        const localDatetime = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        setFormData({
          title: data.title || '',
          description: data.description || '',
          scheduled_datetime: localDatetime,
          duration_minutes: data.duration_minutes || 60,
          location: data.location || '',
          max_participants: data.max_participants || 1,
          workout_type: data.session_type || data.workout_type || '1on1',
          focus_areas: data.focus_areas || [],
          skill_level: data.skill_level || 'intermediate',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load workout');
      } finally {
        setFetching(false);
      }
    };

    fetchWorkout();
  }, [sessionId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const scheduledDateTime = new Date(formData.scheduled_datetime).toISOString();

      await workoutApi.updateWorkout(sessionId, {
        ...formData,
        scheduled_datetime: scheduledDateTime,
      });

      router.push(`/workouts/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update workout');
      setLoading(false);
    }
  };

  if (fetching) {
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
              Back to Workout
            </button>
            <h1 className="font-heading font-bold text-5xl mb-2">
              Edit Workout
            </h1>
            <p className="font-data text-lg text-gray-600 leading-relaxed">
              Update your workout details
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-data text-base">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-signal/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-signal" />
                </span>
                Workout Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Title <span className="text-signal">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Morning Strength Training"
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>

                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe your workout..."
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base resize-none focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-signal/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-signal" />
                </span>
                Schedule
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Date & Time <span className="text-signal">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_datetime"
                    value={formData.scheduled_datetime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>

                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Duration (minutes) <span className="text-signal">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                    min="15"
                    max="180"
                    step="15"
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Location <span className="text-signal">*</span>
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow bg-white"
                  >
                    <option value="">Select a location...</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    {/* If current location isn't in the list, keep it */}
                    {formData.location && !LOCATIONS.includes(formData.location) && (
                      <option value={formData.location}>{formData.location}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-signal/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-signal" />
                </span>
                Focus Areas
              </h2>

              <div className="flex flex-wrap gap-3">
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocusArea(area)}
                    className={`px-5 py-3 rounded-2xl font-data text-base font-semibold transition-all ${
                      formData.focus_areas.includes(area)
                        ? 'bg-signal text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 rounded-2xl font-heading font-semibold text-base border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-magnetic bg-signal text-white px-8 py-4 rounded-2xl font-heading font-semibold text-base inline-flex items-center gap-3 disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
