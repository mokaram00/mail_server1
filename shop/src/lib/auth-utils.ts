// Utility functions for Supabase authentication in the frontend

export interface User {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
  fullName?: string;
  avatar?: string;
}

/**
 * Get current user information from Supabase using stored tokens
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get tokens from localStorage
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken) {
      return null;
    }

    // Call our API to get user info (which will verify the token with Supabase)
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user as User;
    } else if (response.status === 401) {
      // Token expired or invalid, try to refresh
      if (refreshToken) {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          // Save new tokens
          localStorage.setItem('access_token', refreshData.access_token);
          if (refreshData.refresh_token) {
            localStorage.setItem('refresh_token', refreshData.refresh_token);
          }

          // Retry getting user info
          const retryResponse = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${refreshData.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData.user as User;
          }
        }
      }

      // If refresh failed or no refresh token, clear storage and return null
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

/**
 * Sign out user and clear all stored data
 */
export async function signOut(): Promise<void> {
  try {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      // Call Supabase sign out
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Error during sign out:', error);
  } finally {
    // Clear local storage regardless of API call result
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): string | null {
  const accessToken = localStorage.getItem('access_token');
  return accessToken ? `Bearer ${accessToken}` : null;
}