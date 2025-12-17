'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.API}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin access required.');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background animate-fadeIn">
      <div className="w-full max-w-md animate-fadeInSlideUp" style={{ opacity: 1, transform: 'translateY(0)' }}>
        <div className="rounded-xl border bg-card text-card-foreground border-foreground shadow-xl transition-all duration-300">
          <div className="flex flex-col p-6 space-y-1">
            <div className="flex items-center justify-center mb-6 animate-bounceIn">
              <div className="rounded-full bg-foreground p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-8 w-8 text-background">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div className="font-bold tracking-tight text-3xl text-center animate-fadeIn text-foreground">Admin Login</div>
            <div className="text-base text-foreground text-center animate-fadeIn delay-100">Sign in to access the admin dashboard</div>
          </div>
          <div className="p-6 pt-0">
            {error && (
              <div className="bg-foreground text-background p-3 rounded-lg mb-6 animate-shake">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn delay-150">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground" htmlFor="email">Email</label>
                <input 
                  type="email" 
                  className="flex h-12 w-full rounded-lg border border-foreground bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300" 
                  id="email" 
                  placeholder="admin@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground" htmlFor="password">Password</label>
                <input 
                  type="password" 
                  className="flex h-12 w-full rounded-lg border border-foreground bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300" 
                  id="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-foreground text-background hover:bg-muted h-12 px-4 py-2 w-full hover:scale-[1.02] active:scale-[0.98]" 
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