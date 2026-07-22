'use client';

import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Calendar, Users, TrendingUp, Clock, Target } from 'lucide-react';

// Card 1: Enhanced Diagnostic Shuffler
const SHUFFLER_LABELS = [
  { label: 'FIND', sub: 'Compatible Partners', color: '#E63B2E' },
  { label: 'BOOK', sub: 'Workouts', color: '#111111' },
  { label: 'BUILD', sub: 'Fitness Communities', color: '#E8E4DD' },
];

function ShufflerCard() {
  const [cards, setCards] = useState(SHUFFLER_LABELS);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCards((prev) => {
        const newCards = [...prev];
        newCards.unshift(newCards.pop()!);
        return newCards;
      });
    }, 3500);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="relative h-96">
      {cards.map((item, index) => (
        <div
          key={item.label}
          className="absolute w-full bg-offwhite border-2 border-black rounded-[2.5rem] p-10 transition-all duration-700 cursor-pointer hover:shadow-2xl"
          style={{
            transform: `translateY(${index * 32}px) scale(${1 - index * 0.1}) rotate(${index * -0.5}deg)`,
            zIndex: cards.length - index,
            opacity: index === 0 ? 1 : 0.7 - index * 0.15,
            backgroundColor: index === 0 ? '#FFFFFF' : '',
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="font-data text-sm mb-3 tracking-widest" style={{ color: item.color }}>
            {item.label}
          </div>
          <div className="font-heading font-bold text-3xl leading-tight">
            {item.sub}
          </div>
          {index === 0 && (
            <div className="mt-6 flex items-center gap-2 text-black/60">
              <div className="w-2 h-2 bg-signal rounded-full animate-pulse" />
              <span className="font-data text-xs">ACTIVE</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Card 2: Enhanced Telemetry Typewriter
function TypewriterCard() {
  const messages = [
    'Searching for compatible partners...',
    'Found 3 new matches nearby.',
    'Workout scheduled for tomorrow.',
    'Community growing: 127 active members.',
    'New gym buddy request from Sarah.',
  ];

  const [currentMessage, setCurrentMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (charIndex < messages[messageIndex].length) {
      const timeout = setTimeout(() => {
        setCurrentMessage((prev) => prev + messages[messageIndex][charIndex]);
        setCharIndex(charIndex + 1);
      }, 40);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      const timeout = setTimeout(() => {
        setIsTyping(true);
        setCurrentMessage('');
        setCharIndex(0);
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, messageIndex, messages]);

  return (
    <div className="bg-black text-white border-2 border-signal/30 rounded-[2.5rem] p-10 h-96 flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-signal rounded-full filter blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex items-center gap-3 mb-6">
        <div className={`w-3 h-3 ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-signal'} rounded-full`} />
        <span className="font-data text-sm tracking-widest">LIVE FEED</span>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <p className="font-data text-xl leading-relaxed text-center">
          <span className="text-white/90">{currentMessage}</span>
          <span className="text-signal animate-pulse ml-1">|</span>
        </p>
      </div>

      <div className="relative z-10 flex gap-2 justify-center">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === messageIndex ? 'bg-signal scale-125' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Card 3: Enhanced Cursor Protocol Scheduler
function SchedulerCard() {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [showSave, setShowSave] = useState(false);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const runAnimation = async () => {
      // Reset
      setActiveDay(null);
      setShowSave(false);

      // Activate random day
      setTimeout(() => {
        const dayIndex = Math.floor(Math.random() * 7);
        setActiveDay(dayIndex);
      }, 800);

      // Show save button
      setTimeout(() => {
        setShowSave(true);
      }, 1600);

      // Reset and loop
      setTimeout(() => {}, 4000);
    };

    runAnimation();
    intervalRef.current = setInterval(runAnimation, 5000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="bg-white border-2 border-black rounded-[2.5rem] p-10 h-96 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-signal/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        <h3 className="font-heading font-bold text-2xl mb-2">SCHEDULE</h3>
        <p className="font-data text-sm text-black/60">Set your availability</p>
      </div>

      {/* Enhanced Week Grid */}
      <div className="relative z-10 grid grid-cols-7 gap-3">
        {days.map((day, i) => (
          <div
            key={i}
            className={`aspect-square border-2 rounded-xl flex items-center justify-center font-data text-sm font-bold transition-all duration-300 cursor-pointer ${
              activeDay === i
                ? 'bg-signal text-white border-signal scale-110 shadow-lg shadow-signal/30'
                : 'border-black/20 hover:border-black/40 hover:scale-105'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Enhanced Save Button */}
      <div
        className={`relative z-10 transition-all duration-500 ${
          showSave ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button className="w-full bg-black text-white py-4 rounded-xl font-data text-sm font-bold tracking-wider hover:bg-signal transition-colors duration-300">
          SAVE PREFERENCES
        </button>
      </div>
    </div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Stagger card visibility
    const timeouts = [0, 200, 400].map((delay, i) =>
      setTimeout(() => {
        setVisibleCards((prev) => {
          const newVisible = [...prev];
          newVisible[i] = true;
          return newVisible;
        });
      }, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <section ref={sectionRef} className=" pb-32 px-8 lg:px-16 bg-paper relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-signal rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-black rounded-full filter blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Enhanced Section Header */}
        <div className="mb-20 opacity-0 translate-y-8 transition-all duration-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-1 bg-signal" />
            <span className="font-data text-sm tracking-widest text-signal">PROCESS</span>
          </div>
          <h2 className="font-heading font-bold text-6xl md:text-7xl mb-6">
            HOW IT
            <span className="font-drama italic text-signal"> WORKS.</span>
          </h2>
          <p className="font-data text-xl text-black/70 max-w-2xl leading-relaxed">
            Three simple steps to find your perfect workout partner.
          </p>
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid md:grid-cols-3 gap-10">
          <div className={`transition-all duration-700 ${visibleCards[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <ShufflerCard />
          </div>
          <div className={`transition-all duration-700 delay-100 ${visibleCards[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <TypewriterCard />
          </div>
          <div className={`transition-all duration-700 delay-200 ${visibleCards[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <SchedulerCard />
          </div>
        </div>

        {/* Enhanced Feature List */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          {[
            { icon: Dumbbell, title: 'Smart Profiles', desc: 'Rich fitness profiles with goals and preferences' },
            { icon: Calendar, title: 'Easy Booking', desc: 'Schedule 1-on-1 or group sessions' },
            { icon: Users, title: 'Group Hub', desc: 'Create or join workout communities' },
            { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your fitness journey' },
            { icon: Clock, title: 'Flexible Scheduling', desc: 'Find partners that match your availability' },
            { icon: Target, title: 'Smart Matching', desc: 'AI-powered compatibility scoring' },
          ].map((feature, i) => (
            <div
              key={i}
              className="group flex gap-5 p-6 bg-white border-2 border-transparent rounded-2xl hover:border-black/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-14 h-14 bg-signal/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-signal transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-signal group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg mb-2 group-hover:text-signal transition-colors duration-300">{feature.title}</h4>
                <p className="font-data text-sm text-black/60 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
