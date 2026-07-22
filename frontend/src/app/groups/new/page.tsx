'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { groupApi } from '@/lib/api';
import {
  Users,
  Target,
  ArrowLeft,
  Save,
} from 'lucide-react';

const INTERESTS = [
  'weightlifting',
  'cardio',
  'yoga',
  'crossfit',
  'running',
  'cycling',
  'swimming',
  'martial_arts',
  'pilates',
  'hiit',
];

const FOCUS_AREAS = [
  'strength',
  'endurance',
  'flexibility',
  'weight_loss',
  'muscle_gain',
  'sports_performance',
  'general_fitness',
];

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    focus_areas: [] as string[],
    skill_level: 'any',
    max_members: 20,
    is_private: false,
    location: '',
    interests: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area],
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await groupApi.createGroup(formData);

      router.push('/groups');
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      setLoading(false);
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
              Back to Groups
            </button>
            <h1 className="font-heading font-bold text-5xl mb-2">
              Create
              <span className="font-drama italic text-signal"> Group</span>
            </h1>
            <p className="font-data text-lg text-gray-600 leading-relaxed">
              Build a community of fitness enthusiasts
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
                  <Users className="w-5 h-5 text-signal" />
                </span>
                Group Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Group Name <span className="text-signal">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Morning Cardio Crew"
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>

                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Description <span className="text-signal">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    placeholder="What is your group about? Who should join?"
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base resize-none focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>

                <div>
                  <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Campus Gym"
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Group Settings */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-heading font-bold text-2xl mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-signal/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-signal" />
                </span>
                Group Settings
              </h2>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                      Skill Level <span className="text-signal">*</span>
                    </label>
                    <select
                      name="skill_level"
                      value={formData.skill_level}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow bg-white"
                    >
                      <option value="any">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-data text-base font-semibold mb-3 text-gray-900">
                      Max Members <span className="text-signal">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_members"
                      value={formData.max_members}
                      onChange={handleInputChange}
                      required
                      min="2"
                      max="100"
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl font-data text-base focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition-shadow"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl">
                  <input
                    type="checkbox"
                    name="is_private"
                    id="is_private"
                    checked={formData.is_private}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded-lg accent-signal"
                  />
                  <label htmlFor="is_private" className="font-data text-base font-medium cursor-pointer">
                    Private Group (requires approval to join)
                  </label>
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

            {/* Interests */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-heading font-bold text-2xl mb-8">Interests & Activities</h2>

              <div className="flex flex-wrap gap-3">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-5 py-3 rounded-2xl font-data text-base font-semibold transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-signal text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {interest.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                <Save className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
