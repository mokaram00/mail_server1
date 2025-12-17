'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{username: string, email: string} | null>(null);

  useEffect(() => {
    // Set active tab based on current path
    if (pathname?.includes('/admin/users')) {
      setActiveTab('users');
    } else if (pathname?.includes('/admin/domains')) {
      setActiveTab('domains');
    } else if (pathname?.includes('/admin/classifications')) {
      setActiveTab('classifications');
    } else if (pathname?.includes('/admin/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('dashboard');
    }
    
    // Get current user from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground/20 bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">
                  {currentUser?.username?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <span className="hidden md:inline font-medium">{currentUser?.username || 'Admin'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-foreground/20 rounded-lg shadow-lg z-10">
                <div className="px-4 py-3 border-b border-foreground/10">
                  <p className="text-sm font-medium">{currentUser?.username || 'Admin'}</p>
                  <p className="text-xs text-foreground/60 truncate">{currentUser?.email || 'admin@example.com'}</p>
                </div>
                <button
                  onClick={() => {
                    router.push('/admin/settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-red-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-foreground/20 bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 space-x-6">
            <button
              onClick={() => router.push('/admin')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => router.push('/admin/domains')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'domains'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Domains
            </button>
            <button
              onClick={() => router.push('/admin/classifications')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'classifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Classifications
            </button>
            <button
              onClick={() => router.push('/admin/settings')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}