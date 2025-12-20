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
    <header className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white shadow-2xl border-b border-gray-700 z-50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      {/* Elegant floating elements */}
      <div className="absolute top-4 left-10 w-16 h-16 border border-white/10 rounded-full animate-pulse opacity-20"></div>
      <div className="absolute top-6 right-16 w-12 h-12 border border-white/10 rounded-full animate-pulse opacity-15" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-4 left-1/4 w-10 h-10 border border-white/10 rounded-full animate-pulse opacity-10" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Elegant Logo */}
          <SubdomainLink href="/" className="group">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                {/* 3D Logo Container */}
                <div className="relative w-14 h-14">
                  {/* Main circle */}
                  <div className="w-14 h-14 bg-gradient-to-br from-white via-gray-200 to-gray-300 rounded-2xl shadow-2xl transform group-hover:scale-110 transition-all duration-500 rotate-12 group-hover:rotate-0"></div>

                  {/* Inner shadow */}
                  <div className="absolute inset-1 w-12 h-12 bg-gradient-to-br from-gray-100 to-white rounded-xl shadow-inner"></div>

                  {/* Letter R with 3D effect */}
                  <div className="absolute inset-0 w-14 h-14 flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-br from-gray-700 via-black to-gray-800 bg-clip-text text-transparent transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                      R
                    </span>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>

              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent group-hover:from-gray-200 group-hover:via-white group-hover:to-gray-200 transition-all duration-300">
                  Bltnm Shop
                </h1>
                <p className="text-xs text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">Premium Tools & Design</p>
              </div>

              {/* Mobile logo text */}
              <div className="sm:hidden">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  BS
                </h1>
              </div>
            </div>
          </SubdomainLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <SubdomainLink href="/" className="relative group py-2">
              <span className="text-white hover:text-gray-300 transition-colors duration-300 font-medium relative">
                Home
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-white to-gray-300 group-hover:w-full transition-all duration-300"></div>
              </span>
            </SubdomainLink>
    
              <SubdomainLink href="/products" className="relative group py-2">
                <span className="text-white hover:text-gray-300 transition-colors duration-300 font-medium relative">
                  Products
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-white to-gray-300 group-hover:w-full transition-all duration-300"></div>
                </span>
              </SubdomainLink>
        
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <SubdomainLink href="/cart" className="relative group">
                    <div className={`flex items-center space-x-3 rtl:space-x-reverse bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-3 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
                      <div className="relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 2.25h1.386c.51 0 .955.343 1.09.835l.383 1.436m0 0L6.75 14.25h10.5l2.25-9H5.109m0 0L4.5 4.5m2.25 9.75a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                          />
                        </svg>
                        {state.itemCount > 0 && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-white to-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-black">{state.itemCount}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-sm">Cart</span>
                    </div>
                  </SubdomainLink>
                <SubdomainLink href="/login" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                Login
                </SubdomainLink>
                <SubdomainLink href="/register" className="bg-gradient-to-r from-white to-gray-200 text-black px-6 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Register
                </SubdomainLink>
              </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative group p-2"
          >
            <div className="w-8 h-8 flex flex-col justify-center items-center space-y-1">
              <div className={`w-6 h-0.5 bg-white transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-white transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg border-t border-white/10">
            <nav className="px-4 py-6 space-y-4">
              <SubdomainLink href="/" className="block text-white hover:text-gray-300 transition-colors duration-200 font-medium py-3 border-b border-white/10">
                Home
              </SubdomainLink>
              <SubdomainLink href="/products" className="block text-white hover:text-gray-300 transition-colors duration-200 font-medium py-3 border-b border-white/10">
                Products
              </SubdomainLink>
              <SubdomainLink href="/contact" className="block text-white hover:text-gray-300 transition-colors duration-200 font-medium py-3 border-b border-white/10">
                Contact
              </SubdomainLink>

              {/* Mobile Auth Section */}
              {isAuth ? (
                <>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-black">
                          {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user?.fullName || user?.name || 'User'}</p>
                        <p className="text-gray-400 text-xs">{user?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <SubdomainLink href="/profile" className="block text-white hover:text-gray-300 text-sm py-1">
                      Profile
                      </SubdomainLink>
                      <SubdomainLink href="/orders" className="block text-white hover:text-gray-300 text-sm py-1">
                      Orders
                      </SubdomainLink>
                      <SubdomainLink href='dashboard' className="block text-white hover:text-gray-300 text-sm py-1">
                        Dashboard                        
                      </SubdomainLink>
              
                      <button
                        onClick={handleLogout}
                        className="block w-full text-right text-red-400 hover:text-red-300 text-sm py-1"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                    <SubdomainLink href="/cart" className="block">
                      <div className={`flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 transition-all duration-300 ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
                        <span className="text-white font-medium">Cart</span>
                        {state.itemCount > 0 && (
                          <span className="bg-gradient-to-br from-white to-gray-300 text-black text-sm rounded-full px-2 py-1 font-bold">
                            {state.itemCount}
                          </span>
                        )}
                      </div>
                    </SubdomainLink>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Show cart button only on shop and main domains */}
                  
                    <SubdomainLink href="/cart" className="block">
                      <div className={`flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 transition-all duration-300 ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
                        <span className="text-white font-medium">Cart</span>
                        {state.itemCount > 0 && (
                          <span className="bg-gradient-to-br from-white to-gray-300 text-black text-sm rounded-full px-2 py-1 font-bold">
                            {state.itemCount}
                          </span>
                        )}
                      </div>
                    </SubdomainLink>
                  <SubdomainLink href="/login" className="block w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-center px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300">
                    Login
                  </SubdomainLink>
                  <SubdomainLink href="/register" className="block w-full bg-gradient-to-r from-white to-gray-200 text-black text-center px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    Register
                  </SubdomainLink>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Elegant bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </header>
  );
}