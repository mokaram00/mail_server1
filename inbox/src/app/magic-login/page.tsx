'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../components/apiClient';

export default function MagicLogin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(true);
  
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get token from window.location since we can't use useSearchParams during SSR
  const getTokenFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('token');
    }
    return null;
  };

  // Calculate time remaining in seconds
  const calculateTimeRemaining = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    return Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format expiration date in a user-friendly way
  const formatExpirationDate = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    return expiryDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = getTokenFromUrl();
      
      if (!token) {
        setError('Invalid or missing token');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.generateMagicLink(token); // This will verify the token
        setSuccess(true);
        if (response.magicLinkExpiresAt) {
          setExpiresAt(response.magicLinkExpiresAt);
          setTimeRemaining(calculateTimeRemaining(response.magicLinkExpiresAt));
        }
        // Redirect to inbox after a short delay
        setTimeout(() => {
          router.push('/inbox');
        }, 2000);
      } catch (err) {
        setError('Invalid or expired magic link');
        console.error('Magic link verification failed:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  // Set up interval to update time remaining
  useEffect(() => {
    if (expiresAt) {
      intervalRef.current = setInterval(() => {
        const remaining = calculateTimeRemaining(expiresAt);
        setTimeRemaining(remaining);
        
        // If time is up, stop the interval
        if (remaining <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fadeIn scale-80 origin-center" style={{ transformOrigin: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-foreground">Verifying magic link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 space-y-6 border border-border animate-fadeInZoom scale-80 origin-center" style={{ transformOrigin: 'center' }}>
          <div className="text-center">
            <div className="mx-auto bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 animate-bounceIn">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 animate-fadeIn">Login Failed</h1>
            <p className="text-foreground/80 mb-6 animate-fadeIn delay-100">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 animate-fadeIn delay-150"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* Expiration Modal */}
        {showModal && timeRemaining !== null && timeRemaining > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-card rounded-xl shadow-2xl p-6 max-w-md w-full border border-border animate-fadeInZoom">
              <div className="text-center">
                <div className="mx-auto bg-blue-100 text-blue-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 animate-bounceIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Magic Link Active</h2>
                <p className="text-foreground/80 mb-4">
                  Your magic link will expire in:
                </p>
                <div className="text-3xl font-bold text-primary mb-6 animate-pulse">
                  {formatTime(timeRemaining)}
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Sign in and reset your password quickly before the magic link expires!
                      </p>
                      {expiresAt && (
                        <p className="text-xs text-yellow-600 mt-2">
                          Link expires on: {formatExpirationDate(expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 w-full"
                >
                  Got it, continue to inbox
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 space-y-6 border border-border animate-fadeInZoom scale-80 origin-center" style={{ transformOrigin: 'center' }}>
          <div className="text-center">
            <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 animate-bounceIn">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 animate-fadeIn">Login Successful!</h1>
            <p className="text-foreground/80 mb-6 animate-fadeIn delay-100">Redirecting to your inbox...</p>
            
            {/* Show expiration time if available */}
            {timeRemaining !== null && timeRemaining > 0 && expiresAt && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">
                  Magic link expires in: <span className="font-bold">{formatTime(timeRemaining)}</span>
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Link expires on: {formatExpirationDate(expiresAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}