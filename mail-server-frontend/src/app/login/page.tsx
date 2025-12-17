'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Simulate loading state
    setIsLoading(true);
    
    // In a real application, you would authenticate with your backend here
    // For now, we'll just redirect to the inbox after a short delay
    setTimeout(() => {
      router.push('/inbox');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background animate-fadeIn">
      <div className="absolute top-4 right-4 animate-fadeInSlideDown">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-fadeInSlideUp" style={{ opacity: 1, transform: 'translateY(0)' }}>
        <div className="rounded-xl border bg-card text-card-foreground border-foreground shadow-xl transition-all duration-300">
          <div className="flex flex-col p-6 space-y-1">
            <div className="flex items-center justify-center mb-6 animate-bounceIn">
              <div className="rounded-full bg-foreground p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail h-8 w-8 text-background">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
              </div>
            </div>
            <div className="font-bold tracking-tight text-3xl text-center animate-fadeIn text-foreground">Welcome Back</div>
            <div className="text-base text-foreground text-center animate-fadeIn delay-100">Sign in to your email account</div>
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
                  placeholder="you@example.com" 
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
                disabled={isLoading}
              >
                {isLoading ? (
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
          <div className="items-center p-6 pt-0 flex justify-center animate-fadeIn delay-200">
            <p className="text-sm text-foreground">Secure IMAP Email Client</p>
          </div>
        </div>
      </div>
    </div>
  );
}