'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(formData.username, formData.password);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      // Shake animation on error
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Welcome back to GymBuddy">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl font-data text-sm animate-in">
            {error}
          </div>
        )}

        {/* Enhanced Username Field */}
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'username' ? 'transform scale-105' : ''}`}>
          <label htmlFor="username" className="block font-data text-sm font-bold tracking-wider">
            USERNAME
          </label>
          <input
            id="username"
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            className="w-full px-5 py-4 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300"
            placeholder="Enter your username"
          />
        </div>

        {/* Enhanced Password Field */}
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'password' ? 'transform scale-105' : ''}`}>
          <label htmlFor="password" className="block font-data text-sm font-bold tracking-wider">
            PASSWORD
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-5 py-4 pr-12 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 hover:text-signal transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-data font-bold text-black/60 hover:text-signal transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal text-white py-5 rounded-2xl font-heading font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-signal/30 relative overflow-hidden group"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              <span className="relative z-10">SIGN IN</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </>
          )}
        </button>
      </form>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </AuthLayout>
  );
}
