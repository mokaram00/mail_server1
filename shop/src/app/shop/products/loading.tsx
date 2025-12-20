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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Header */}
        <div className="mb-8">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse mb-4"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-1/3"></div>
        </div>

        {/* Search Bar Loading */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
            </div>
            <div className="md:w-64">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
            </div>
            <div className="h-12 w-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl animate-pulse"></div>
          </div>
        </div>

        {/* Products Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Image placeholder */}
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse"></div>
                {/* Featured badge placeholder */}
                <div className="absolute top-4 right-4 w-16 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
              </div>

              {/* Content placeholder */}
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-3/4"></div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse w-16"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse w-20"></div>
                </div>

                <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}