'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated, getCurrentUser } from '@/lib/auth-utils';

export default function Loading() {
  const [authChecked, setAuthChecked] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    // Initialize authentication and language settings
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        const authenticated = isAuthenticated();
        if (authenticated) {
          await getCurrentUser(); // This will set the user in localStorage
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setAuthChecked(true);
      }
    };

    // Small delay to ensure language context is ready
    const timer = setTimeout(() => {
      setLanguageReady(true);
    }, 100);

    initializeApp();

    return () => clearTimeout(timer);
  }, []);

  // Show simple loading while initializing
  if (!authChecked || !languageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        {/* Main Loading Container */}
        <div className="relative">
          {/* Animated Logo */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-black via-gray-800 to-black rounded-3xl shadow-2xl animate-pulse"></div>
            <div className="absolute inset-2 w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-inner"></div>
            <div className="absolute inset-0 w-20 h-20 flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-br from-gray-800 via-black to-gray-700 bg-clip-text text-transparent animate-pulse">
                R
              </span>
            </div>

            {/* Rotating ring */}
            <div className="absolute inset-0 w-20 h-20 border-2 border-gray-300 rounded-3xl animate-spin opacity-20"></div>
            <div className="absolute inset-1 w-18 h-18 border-2 border-transparent border-t-black border-r-gray-600 rounded-3xl animate-spin"></div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
              Loading...
            </h3>
            <p className="text-gray-600 text-sm">
              Preparing your experience
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-3 h-3 bg-gradient-to-br from-black to-gray-600 rounded-full animate-bounce"
                style={{ animationDelay: `${index * 0.2}s` }}
              ></div>
            ))}
          </div>

          {/* Subtle background elements */}
          <div className="absolute top-0 left-0 w-full h-full -z-10">
            <div className="absolute top-10 left-10 w-16 h-16 border border-gray-200 rounded-full animate-pulse opacity-10"></div>
            <div className="absolute bottom-10 right-10 w-12 h-12 border border-gray-200 rounded-full animate-pulse opacity-8" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-10 h-10 border border-gray-200 rounded-full animate-pulse opacity-6" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}