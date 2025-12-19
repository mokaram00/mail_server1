'use client';

import { useState, useEffect } from 'react';
import { getCsrfToken, setCsrfToken } from './apiClient';

// Hook to manage CSRF token
export const useCsrfToken = () => {
  const [token, setToken] = useState<string | null>(getCsrfToken());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch CSRF token
  const fetchCsrfToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make a GET request to any endpoint to get the CSRF token
      const response = await fetch('/health', {
        method: 'GET',
        credentials: 'include',
      });
      
      const csrfToken = response.headers.get('x-csrf-token');
      if (csrfToken) {
        setCsrfToken(csrfToken);
        setToken(csrfToken);
      }
      
      setLoading(false);
      return csrfToken || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  // Initialize CSRF token on mount
  useEffect(() => {
    if (!token) {
      fetchCsrfToken();
    }
  }, []);

  return { token, loading, error, fetchCsrfToken };
};