'use client';

import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="px-8 lg:px-16 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-signal" />
            <span className="font-heading font-bold text-xl">GymBuddy</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link href="/matching" className="font-data text-sm text-gray-400 hover:text-white transition-colors">
              Find Buddies
            </Link>
            <Link href="/workouts" className="font-data text-sm text-gray-400 hover:text-white transition-colors">
              Workouts
            </Link>
            <Link href="/groups" className="font-data text-sm text-gray-400 hover:text-white transition-colors">
              Groups
            </Link>
          </nav>

          {/* Copyright */}
          <p className="font-data text-xs text-gray-500">
            © 2026 GymBuddy
          </p>
        </div>
      </div>
    </footer>
  );
}
