'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page by default
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Mail Server Application
          </h1>
          <p className="text-lg text-foreground mb-8">
            Redirecting to the application...
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}