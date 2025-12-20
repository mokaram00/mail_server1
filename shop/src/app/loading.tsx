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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* Enhanced Loading Container */}
        <div className="relative">
          {/* Enhanced Animated Logo */}
          <div className="relative w-24 h-24 mx-auto mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-foreground via-gray-800 to-foreground rounded-3xl shadow-2xl animate-pulse"></div>
            <div className="absolute inset-2 w-20 h-20 bg-gradient-to-br from-background to-gray-50 rounded-2xl shadow-inner"></div>
            <div className="absolute inset-0 w-24 h-24 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-br from-gray-800 via-black to-gray-700 bg-clip-text text-transparent animate-pulse drop-shadow-sm">
                R
              </span>
            </div>

            {/* Enhanced rotating rings */}
            <div className="absolute inset-0 w-24 h-24 border-2 border-gray-300 rounded-3xl animate-spin opacity-30"></div>
            <div className="absolute inset-1 w-22 h-22 border-2 border-transparent border-t-foreground border-r-gray-600 rounded-3xl animate-spin animation-delay-1000"></div>
          </div>

          {/* Enhanced Loading Text */}
          <div className="space-y-3">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Loading...
            </h3>
            <p className="text-muted-foreground text-base">
              Preparing your experience
            </p>
          </div>

          {/* Enhanced Animated Dots */}
          <div className="flex justify-center space-x-3 mt-8">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-4 h-4 bg-gradient-to-br from-foreground to-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${index * 0.2}s` }}
              ></div>
            ))}
          </div>

          {/* Enhanced background elements */}
          <div className="absolute top-0 left-0 w-full h-full -z-10">
            <div className="absolute top-10 left-10 w-20 h-20 border border-gray-200 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border border-gray-200 rounded-full animate-pulse opacity-15" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 border border-gray-200 rounded-full animate-pulse opacity-10" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}