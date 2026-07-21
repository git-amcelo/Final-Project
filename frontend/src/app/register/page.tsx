'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'student',
    gender: 'N',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authApi.register(formData);
      // Auto-login after registration
      await authApi.login(formData.username, formData.password);
      router.push('/dashboard?new=true');
      router.refresh();
    } catch (err: any) {
      console.error('Registration error:', err);
      // Handle Django validation errors
      if (err?.message) {
        try {
          const errorData = JSON.parse(err.message);
          if (typeof errorData === 'object') {
            const errorMessages = Object.entries(errorData)
              .map(([field, errors]) => {
                const fieldErrors = Array.isArray(errors) ? errors : [errors];
                return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${fieldErrors.join(', ')}`;
              })
              .join('\n');
            setError(errorMessages);
          } else {
            setError(err.message);
          }
        } catch {
          setError(err.message);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join the GymBuddy community">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="Choose a username"
          />
        </div>

        {/* Enhanced Email Field */}
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
            placeholder="your.email@uwindsor.ca"
          />
        </div>

        {/* Enhanced Password Field with Strength Indicator */}
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
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setPasswordStrength(calculatePasswordStrength(e.target.value));
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-5 py-4 pr-12 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 hover:text-signal transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="flex gap-1 mt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i < passwordStrength
                      ? passwordStrength <= 1
                        ? 'bg-red-500'
                        : passwordStrength === 2
                        ? 'bg-yellow-500'
                        : passwordStrength === 3
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                      : 'bg-black/10'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Confirm Password Field */}
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'password_confirm' ? 'transform scale-105' : ''}`}>
          <label htmlFor="password_confirm" className="block font-data text-sm font-bold tracking-wider">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              id="password_confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password_confirm}
              onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              onFocus={() => setFocusedField('password_confirm')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-5 py-4 pr-12 border-2 rounded-2xl font-heading text-lg focus:outline-none focus:ring-4 transition-all duration-300 ${
                formData.password_confirm && formData.password === formData.password_confirm
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                  : 'border-black/20 focus:border-signal focus:ring-signal/10'
              }`}
              placeholder="Confirm your password"
            />
            {formData.password_confirm && formData.password === formData.password_confirm && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Role Selection */}
        <div className="space-y-3">
          <label className="block font-data text-sm font-bold tracking-wider">
            I AM A
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(['student', 'alumni'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`py-4 rounded-2xl font-heading font-bold text-lg border-2 transition-all duration-300 ${
                  formData.role === role
                    ? 'bg-signal text-white border-signal shadow-lg shadow-signal/30 scale-105'
                    : 'bg-white border-black/20 hover:border-black/40 hover:scale-102'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Selection */}
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'gender' ? 'transform scale-105' : ''}`}>
          <label htmlFor="gender" className="block font-data text-sm font-bold tracking-wider">
            GENDER (OPTIONAL)
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            onFocus={() => setFocusedField('gender')}
            onBlur={() => setFocusedField(null)}
            className="w-full px-5 py-4 border-2 border-black/20 rounded-2xl font-heading text-lg focus:outline-none focus:border-signal focus:ring-4 focus:ring-signal/10 transition-all duration-300 bg-white"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
            <option value="N">Prefer not to say</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal text-white py-5 rounded-2xl font-heading font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-signal/30 relative overflow-hidden group mt-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </span>
          ) : (
            <>
              <span className="relative z-10">CREATE ACCOUNT</span>
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
