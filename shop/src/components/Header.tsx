'use client';

import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, signOut } from '@/lib/auth-utils';
import SubdomainLink from '../components/SubdomainLink'

export default function Header() {
  const { state } = useCart();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    };

    checkAuth();
  }, []);

  // Animate cart icon when an item is added
  useEffect(() => {
    let bounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleCartAdd = () => {
      setIsCartAnimating(true);
      if (bounceTimer) {
        clearTimeout(bounceTimer);
      }
      bounceTimer = setTimeout(() => {
        setIsCartAnimating(false);
      }, 650);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cart:add', handleCartAdd);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart:add', handleCartAdd);
      }
      if (bounceTimer) {
        clearTimeout(bounceTimer);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Add bounce effect to interactive elements
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('interactive-element')) {
        target.classList.add('animate-cuteBounce');
        setTimeout(() => {
          target.classList.remove('animate-cuteBounce');
        }, 800);
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuth(false);
      setUser(null);
      setIsUserMenuOpen(false);
      // Use client-side navigation instead of page reload
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      // Fallback to manual cleanup
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setIsAuth(false);
      setUser(null);
      setIsUserMenuOpen(false);
      // Use client-side navigation even on error
      router.push('/');
      router.refresh();
    }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-2xl animate-headerSlideDown">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <SubdomainLink href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-all duration-500 animate-logoPulse">
                <span className="text-2xl font-bold bg-gradient-to-br from-gray-800 to-black bg-clip-text text-transparent">B</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center animate-badgePulse">
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all duration-300">
                Bltnm Store
              </h1>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Premium Tools</p>
            </div>
          </SubdomainLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { name: 'Home', href: '/', delay: 'nav-item-1' },
              { name: 'Products', href: '/products', delay: 'nav-item-2' },
              { name: 'Collections', href: '/collections', delay: 'nav-item-3' },
              { name: 'About', href: '/about', delay: 'nav-item-4' },
            ].map((item) => (
              <SubdomainLink 
                key={item.name}
                href={item.href}
                className={`relative px-5 py-3 text-white/90 hover:text-white font-medium transition-all duration-300 group nav-link-hover ${item.delay} animate-navItemAppear`}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-white/5 rounded-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </SubdomainLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:scale-110 interactive-element btn-glass">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart */}
            <SubdomainLink href="/cart" className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:scale-110 interactive-element btn-glass">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {state.itemCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-white to-gray-300 rounded-full flex items-center justify-center animate-badgePulse">
                  <span className="text-xs font-bold text-black">{state.itemCount}</span>
                </div>
              )}
            </SubdomainLink>

            {/* User Actions */}
            {!isAuth ? (
              <div className="hidden md:flex items-center space-x-3">
                <SubdomainLink 
                  href="/login" 
                  className="px-5 py-2 rounded-full text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg interactive-element btn-glass"
                >
                  Sign In
                </SubdomainLink>
                <SubdomainLink 
                  href="/register" 
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-white to-gray-200 text-black hover:from-gray-200 hover:to-white transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl interactive-element"
                >
                  Register
                </SubdomainLink>
              </div>
            ) : (
              <div className="relative user-menu-container">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition-all duration-300 interactive-element btn-glass"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-black">
                      {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm hidden lg:inline">
                    {user?.fullName || user?.name || 'Account'}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-white transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-3 z-50 animate-userMenuSlideDown">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-medium">{user?.fullName || user?.name || 'User'}</p>
                      <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <SubdomainLink href="/profile" className="block px-4 py-3 text-white hover:bg-white/10 text-sm transition-all duration-200 interactive-element">
                        <div className="flex items-center space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </div>
                      </SubdomainLink>
                      <SubdomainLink href="/orders" className="block px-4 py-3 text-white hover:bg-white/10 text-sm transition-all duration-200 interactive-element">
                        <div className="flex items-center space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Orders</span>
                        </div>
                      </SubdomainLink>
                      <SubdomainLink href="/dashboard" className="block px-4 py-3 text-white hover:bg-white/10 text-sm transition-all duration-200 interactive-element">
                        <div className="flex items-center space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </SubdomainLink>
                    </div>
                    <div className="px-4 pt-3 border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-white/10 text-sm rounded-lg transition-all duration-200 interactive-element"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 interactive-element btn-glass"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <div className={`w-5 h-0.5 bg-white rounded-full transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-white rounded-full transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <>
            <div className="mobile-menu-overlay lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-xl animate-fadeInSlideDown">
              <nav className="px-4 py-6 space-y-1">
                {[
                  { name: 'Home', href: '/' },
                  { name: 'Products', href: '/products' },
                  { name: 'Collections', href: '/collections' },
                  { name: 'About', href: '/about' },
                ].map((item, index) => (
                  <SubdomainLink 
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-4 text-white hover:bg-white/10 rounded-xl text-lg font-medium transition-all duration-200 interactive-element nav-link-hover animate-navItemAppear nav-item-${index + 1}`}
                  >
                    {item.name}
                  </SubdomainLink>
                ))}
                
                <div className="pt-4 border-t border-white/10">
                  {!isAuth ? (
                    <div className="space-y-3">
                      <SubdomainLink 
                        href="/login" 
                        className="block w-full text-center px-5 py-3 rounded-full text-base font-medium bg-white/10 text-white hover:bg-white/20 transition-all duration-300 interactive-element btn-glass"
                      >
                        Sign In
                      </SubdomainLink>
                      <SubdomainLink 
                        href="/register" 
                        className="block w-full text-center px-5 py-3 rounded-full text-base font-semibold bg-gradient-to-r from-white to-gray-200 text-black hover:from-gray-200 hover:to-white transition-all duration-300 interactive-element"
                      >
                        Register
                      </SubdomainLink>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-base font-bold text-black">
                            {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user?.fullName || user?.name || 'User'}</p>
                          <p className="text-gray-400 text-sm">{user?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 interactive-element"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <SubdomainLink href="/cart" className="flex items-center justify-between px-4 py-4 text-white hover:bg-white/10 rounded-xl transition-all duration-200 interactive-element">
                    <div className="flex items-center space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-lg font-medium">Cart</span>
                    </div>
                    {state.itemCount > 0 && (
                      <span className="bg-gradient-to-br from-white to-gray-300 text-black text-sm rounded-full px-3 py-1 font-bold animate-badgePulse">
                        {state.itemCount}
                      </span>
                    )}
                  </SubdomainLink>
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}