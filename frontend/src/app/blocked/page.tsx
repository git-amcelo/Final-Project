'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userApi } from '@/lib/api';
import { Users, Ban, ArrowRight } from 'lucide-react';

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBlocked();
  }, []);

  const fetchBlocked = async () => {
    try {
      const res = await userApi.getBlocked();
      setBlockedUsers(res.results || res);
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: number) => {
    setActionLoadingId(blockId);
    try {
      await userApi.unblockUser(blockId);
      // Remove from list
      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        <div className="bg-paper border-b border-black">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="font-heading font-bold text-4xl mb-2 flex items-center gap-3">
              <Ban className="w-8 h-8 text-red-500" />
              Blocked Users
            </h1>
            <p className="font-data text-black/60">
              Users you have blocked. They cannot interact with you or join your groups.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="font-data text-gray-500">Loading blocked users...</div>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="bg-white shadow-sm rounded-2xl p-12 text-center max-w-2xl mx-auto">
              <Ban className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="font-heading font-bold text-2xl mb-4">No blocked users</h2>
              <p className="font-data text-gray-500 mb-8">
                You haven't blocked anyone. That's great!
              </p>
              <Link
                href="/dashboard"
                className="btn-magnetic bg-signal text-white px-8 py-4 rounded-xl font-heading font-bold inline-flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blockedUsers.map((b) => (
                <BlockedCard 
                  key={b.id} 
                  blockedRecord={b} 
                  onUnblock={() => handleUnblock(b.id)}
                  isUnblocking={actionLoadingId === b.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function BlockedCard({ 
  blockedRecord, 
  onUnblock, 
  isUnblocking 
}: { 
  blockedRecord: any;
  onUnblock: () => void;
  isUnblocking: boolean;
}) {
  const profile = blockedRecord.blocked_profile;
  if (!profile) return null;
  
  return (
    <div className="bg-white shadow-sm rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        {profile.profile_picture_url ? (
          <img 
            src={profile.profile_picture_url} 
            alt={profile.username} 
            className="w-12 h-12 rounded-full object-cover grayscale opacity-70" 
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div>
          <h4 className="font-heading font-bold text-lg text-gray-700">{profile.username}</h4>
          <p className="font-data text-xs text-gray-500">
            Blocked {new Date(blockedRecord.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={onUnblock}
          disabled={isUnblocking}
          className="w-full py-2.5 px-4 bg-red-50 text-red-600 rounded-xl font-data text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isUnblocking ? 'Unblocking...' : 'Unblock User'}
        </button>
      </div>
    </div>
  );
}
