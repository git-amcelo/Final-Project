'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Philosophy() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-40 overflow-hidden bg-black">
      {/* Animated Background with Parallax */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070"
          alt="Background"
          fill
          className="object-cover transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) scale(1.1)`,
          }}
        />
      </div>

      {/* Gradient Overlay with Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-signal/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwTDQwIDQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-signal/10 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/5 rounded-full filter blur-2xl animate-bounce" style={{ animationDuration: '6s' }} />

      <div className="relative z-10 px-8 lg:px-16 max-w-7xl mx-auto">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
          }`}
        >
          {/* Enhanced Contrast Statement */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-1 bg-signal" />
              <span className="font-data text-sm tracking-widest text-white/60">PHILOSOPHY</span>
            </div>

            <p className="font-data text-gray-400 text-xl mb-6 leading-relaxed">
              Most fitness apps focus on:
              <span className="text-white font-bold mx-2">individual tracking</span>
              and
              <span className="text-white font-bold mx-2">solo workouts.</span>
            </p>
          </div>

          {/* Enhanced Main Statement */}
          <h2 className="font-drama italic text-6xl md:text-8xl text-white mb-8 leading-tight">
            We focus on:
            <span className="text-signal block mt-4">human connection.</span>
          </h2>

          {/* Enhanced Description */}
          <p className="font-heading text-2xl text-gray-300 max-w-3xl leading-relaxed">
            GymBuddy is built on the belief that fitness is better together. By matching you
            with compatible partners who share your goals, schedule, and fitness level, we
            transform solitary workouts into motivating social experiences.
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent" />
        <span className="text-white/40 font-data text-xs tracking-widest">SCROLL</span>
      </div>
    </section>
  );
}
