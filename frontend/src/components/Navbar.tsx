'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Menu, X, ChevronRight, User, LogOut, LayoutDashboard, Heart, Ban } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setIsAuthenticated(!!user);
    setCurrentUser(user);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleUserUpdate = () => {
      const updatedUser = authApi.getCurrentUser();
      setCurrentUser(updatedUser);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('user_updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('user_updated', handleUserUpdate);
    };
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    authApi.logout();
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { name: 'Find Buddies', href: '/matching' },
    { name: 'Workouts', href: '/workouts' },
    { name: 'Groups', href: '/groups' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-white/[0.06]'
          : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="absolute -inset-1.5 bg-signal/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Dumbbell className="w-7 h-7 text-signal relative transition-transform duration-300 group-hover:rotate-[-12deg]" />
            </div>
            <span className="font-heading font-bold text-lg text-white tracking-tight">
              GymBuddy
            </span>
          </Link>

          {/* Desktop Nav — centered */}
          <div className="hidden lg:flex items-center">
            {isAuthenticated && (
              <div className="flex items-center gap-1 bg-white/[0.06] rounded-full px-1.5 py-1 border border-white/[0.06]">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-signal text-white shadow-lg shadow-signal/25'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA Button / User Menu */}
          <div className="hidden lg:block">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group relative inline-flex items-center gap-2 bg-white text-black pl-2 pr-5 py-2 rounded-full text-sm font-bold transition-all duration-300 hover:shadow-xl hover:shadow-white/10 hover:scale-[1.03] active:scale-[0.98]"
                >
                  {currentUser?.profile_picture_url ? (
                    <img 
                      src={currentUser.profile_picture_url} 
                      alt="Profile" 
                      className="w-7 h-7 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 opacity-70" />
                    </div>
                  )}
                  <span>{currentUser?.username || 'Account'}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-black/10">
                      <p className="text-sm font-medium text-black">{currentUser?.username || 'User'}</p>
                      <p className="text-xs text-black/60 truncate">{currentUser?.email || ''}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4 text-signal fill-signal" />
                        My Favorites
                      </Link>
                      <Link
                        href="/blocked"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-black/70 hover:bg-black/5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        Blocked Users
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:shadow-xl hover:shadow-white/10 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform duration-300" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden relative p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 active:scale-95"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-2xl border-t border-white/[0.06]">
          <div className="px-6 py-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                  pathname === link.href
                    ? 'bg-signal/10 text-signal'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Auth Section in Mobile */}
            <div className="mt-2 pt-3 border-t border-white/[0.06]">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="px-4 py-3 mb-2">
                    <p className="text-white font-medium">{currentUser?.username || 'User'}</p>
                    <p className="text-white/60 text-sm truncate">{currentUser?.email || ''}</p>
                  </div>

                  {/* Authenticated Links */}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 text-signal fill-signal" />
                    My Favorites
                  </Link>
                  <Link
                    href="/blocked"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Ban className="w-5 h-5 text-red-500" />
                    Blocked Users
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-xl font-bold text-base transition-all hover:bg-white/90 active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
