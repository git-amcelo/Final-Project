'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'newPassword' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword(formData.email, formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="You are all set!">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center animate-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="font-heading text-xl">Your password has been reset successfully.</p>
          <p className="font-data text-gray-500">Redirecting to login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to set a new password">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl font-data text-sm animate-in">
            {error}
          </div>
        )}

        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'email' ? 'transform scale-105' : ''}`}>
          <label htmlFor="email" className="block font-data text-sm font-bold tracking-wider">
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className="w-full px-5 py-4 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300"
            placeholder="Enter your email address"
          />
        </div>

        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'newPassword' ? 'transform scale-105' : ''}`}>
          <label htmlFor="newPassword" className="block font-data text-sm font-bold tracking-wider">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              onFocus={() => setFocusedField('newPassword')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-5 py-4 pr-12 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300"
              placeholder="Enter new password"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-2xl font-heading font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 relative overflow-hidden group"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Resetting...
            </span>
          ) : (
            <>
              <span className="relative z-10">RESET PASSWORD</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </>
          )}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-sm font-data font-bold text-black/60 hover:text-signal transition-colors">
            Back to Sign In
          </Link>
        </div>
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
