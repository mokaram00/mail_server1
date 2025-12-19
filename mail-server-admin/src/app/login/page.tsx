'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Added state for password visibility
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Form submitted');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Check if API URL is defined
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setError('API URL is not defined. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/login`, { email, password });

      // Check if we have email and password
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Redirect to admin dashboard (token is now in cookies)
      console.log('Login successful, redirecting to admin dashboard');
      router.push('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background animate-fadeIn">
      <div className="w-full max-w-md animate-fadeInZoom">
        <div className="rounded-xl border bg-card text-card-foreground border-border shadow-xl">
          <div className="flex flex-col p-6 space-y-1">
            <div className="flex items-center justify-center mb-6 animate-bounceIn">
              <div className="rounded-full bg-primary p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-8 w-8 text-primary-foreground">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div className="font-bold tracking-tight text-3xl text-center text-foreground animate-fadeInSlideDown">Admin Login</div>
            <div className="text-base text-foreground text-center animate-fadeInSlideUp">Sign in to access the admin dashboard</div>
          </div>
          <div className="p-6 pt-0">
            {error && (
              <div className="bg-destructive text-destructive-foreground p-3 rounded-lg mb-6 animate-shake">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground/80" htmlFor="email">Email</label>
                <input 
                  type="email" 
                  className="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200" 
                  id="email" 
                  placeholder="admin@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground/80" htmlFor="password">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 pr-12" 
                    id="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground/50 hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
                        <path d="M10.5 10.5 12 12m0 0 1.5 1.5m-3-3L12 12m0 0 1.5-1.5m-3 3L12 12m0 0-1.5 1.5m3-3L12 12m0 0 1.5 1.5M3 13c3.6-6 14.4-6 18 0"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 w-full transform hover:scale-105" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}