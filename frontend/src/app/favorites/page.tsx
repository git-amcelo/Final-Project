'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userApi } from '@/lib/api';
import { Users, Star, ArrowRight, Heart } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await userApi.getFavorites();
      setFavorites(res.results || res);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        <div className="bg-paper border-b border-black">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="font-heading font-bold text-4xl mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-signal fill-signal" />
              My Favorites
            </h1>
            <p className="font-data text-black/60">
              Users you have added to your favorites list.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="font-data text-gray-500">Loading favorites...</div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white shadow-sm rounded-2xl p-12 text-center max-w-2xl mx-auto">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="font-heading font-bold text-2xl mb-4">No favorites yet</h2>
              <p className="font-data text-gray-500 mb-8">
                You haven't added anyone to your favorites. Find buddies and add them to easily keep track of them!
              </p>
              <Link
                href="/matching"
                className="btn-magnetic bg-signal text-white px-8 py-4 rounded-xl font-heading font-bold inline-flex items-center gap-2"
              >
                Find Buddies <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((fav) => (
                <FavoriteCard key={fav.id} fav={fav} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function FavoriteCard({ fav }: { fav: any }) {
  const profile = fav.favorite_profile;
  if (!profile) return null;
  
  return (
    <Link href={`/profile/${profile.id}`} className="block h-full">
      <div className="bg-white shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow h-full flex flex-col">
        {profile.profile_picture_url ? (
          <img 
            src={profile.profile_picture_url} 
            alt={profile.username} 
            className="w-full aspect-square rounded-xl object-cover mb-4" 
          />
        ) : (
          <div className="w-full aspect-square bg-signal/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-signal/40" />
          </div>
        )}
        <h4 className="font-heading font-bold text-xl truncate">{profile.username}</h4>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="font-data text-sm text-black/60 capitalize">
            {profile.fitness_level || 'Beginner'}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-data text-sm font-medium">{profile.average_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
