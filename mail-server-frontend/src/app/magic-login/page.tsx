'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '../components/apiClient';

export default function MagicLogin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        // Create a custom fetch request for magic link verification since it's not in the apiClient class
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/magic-link/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to verify magic link');
        }

        const data = await response.json();
        console.log('Magic link verified successfully:', data);
        
        setSuccess(true);
        // Redirect to inbox after successful login
        setTimeout(() => {
          router.push('/inbox');
        }, 2000);
      } catch (err: any) {
        console.error('Magic link verification error:', err);
        setError(err.message || 'Failed to verify magic link');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-foreground">Verifying magic link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 space-y-6 border border-border">
          <div className="text-center">
            <div className="mx-auto bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Failed</h1>
            <p className="text-foreground/80 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
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
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 space-y-6 border border-border">
          <div className="text-center">
            <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Successful!</h1>
            <p className="text-foreground/80 mb-6">Redirecting to your inbox...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}