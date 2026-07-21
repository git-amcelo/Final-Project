'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-end overflow-hidden"
      style={{ paddingBottom: 'clamp(4rem, 10vh, 8rem)' }}
    >
      {/* Background Image — full coverage, no GSAP parallax */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070"
          alt="Modern gym interior with equipment"
          fill
          className="object-cover scale-[1.05]"
          priority
          sizes="100vw"
        />
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        {/* Subtle color accent wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-signal/10 via-transparent to-indigo-900/15 mix-blend-soft-light" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-signal/15 rounded-full blur-[120px] z-[1]" />
      <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] z-[1]" />

      {/* Content */}
      <div className="relative z-10 px-6 lg:px-10 max-w-screen-xl mx-auto w-full">
        <div className="max-w-3xl">
          {/* Headline */}
          <h1 className="font-heading font-bold text-white mb-6">
            <div className="overflow-hidden">
              <span
                className={`inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1.05] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-200 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-full'
                }`}
              >
                Find Your
              </span>
            </div>
            <div className="overflow-hidden">
              <span
                className={`inline-block font-drama italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9rem] text-signal leading-[0.95] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[400ms] ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-full'
                }`}
              >
                Workout Partner.
              </span>
            </div>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base sm:text-lg md:text-xl text-white/50 mb-10 max-w-lg font-data leading-relaxed transition-all duration-700 ease-out delay-[600ms] ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
            Building confidence through community — match with compatible gym
            partners, join group sessions, and crush your fitness goals together.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 ease-out delay-[800ms] ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
            <Link
              href="/register"
              className="group relative overflow-hidden bg-signal text-white px-8 py-4 rounded-full font-heading font-bold text-base inline-flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-signal/30 active:scale-[0.98]"
            >
              <span className="relative z-10">Get Started Free</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-signal via-red-500 to-signal bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </Link>
          </div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="text-white/30 font-data text-[10px] tracking-[0.25em] uppercase">
          Scroll
        </span>
        <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
