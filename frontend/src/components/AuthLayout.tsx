'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Loading animation
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Dumbbell className="w-16 h-16 text-signal animate-bounce" />
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-signal rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-signal rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-signal rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-offwhite relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-signal rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-black rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 py-12 min-h-screen">
        <div className="max-w-md w-full">
          {/* Enhanced Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-12 group">
            <div className="relative">
              <div className="absolute inset-0 bg-signal/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
              <Dumbbell className="w-10 h-10 text-signal relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
            </div>
            <span className="font-heading font-bold text-3xl group-hover:tracking-wider transition-all duration-300">
              GymBuddy
            </span>
          </Link>

          {/* Enhanced Header */}
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-4xl mb-4 animate-in">{title}</h1>
            <p className="font-data text-black/60 text-lg">{subtitle}</p>
          </div>

          {/* Enhanced Form Container */}
          <div className="bg-white border-2 border-black rounded-[2.5rem] p-10 shadow-2xl shadow-black/10 hover:shadow-black/20 transition-shadow duration-300">
            {children}
          </div>

          {/* Enhanced Footer */}
          <p className="text-center mt-8 font-data text-sm text-black/60">
            {title === 'Sign In' ? (
              <>
                Don't have an account?{' '}
                <Link href="/register" className="text-signal font-bold hover:underline inline-flex items-center gap-1 group">
                  Sign up
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-signal font-bold hover:underline inline-flex items-center gap-1 group">
                  Sign in
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 border-2 border-black/10 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 border-2 border-signal/10 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
    </div>
  );
}
