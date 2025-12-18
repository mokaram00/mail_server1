'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import GlobalModals from '../components/GlobalModals';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{username: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-auth/profile`, {
          credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        
        // Validate data structure before accessing properties
        if (data && data.admin && typeof data.admin.username === 'string' && typeof data.admin.email === 'string') {
          setCurrentUser({
            username: data.admin.username,
            email: data.admin.email
          });
        } else {
          // If data structure is not as expected, redirect to login
          console.error('Invalid admin data structure:', data);
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Set active tab based on current path
    if (pathname?.includes('/admin/users')) {
      setActiveTab('users');
    } else if (pathname?.includes('/admin/domains')) {
      setActiveTab('domains');
    } else if (pathname?.includes('/admin/classifications')) {
      setActiveTab('classifications');
    } else if (pathname?.includes('/admin/emails')) {
      setActiveTab('emails');
    } else if (pathname?.includes('/admin/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('dashboard');
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include' // Include cookies in the request
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 mt-16 w-64 transform bg-card shadow-lg transition-all duration-300 ease-in-out lg:translate-x-0 rounded-r-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold text-foreground animate-fadeInSlideRight">Admin Panel</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-foreground hover:text-primary transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {/* Dashboard */}
            <button
              onClick={() => router.push('/admin')}
              className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
            
            {/* Users with Dropdown */}
            <div className="w-full">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'users' ? null : 'users')}
                className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  activeTab.startsWith('users')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center">
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users
                </div>
                <svg className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'users' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'users' && (
                <div className="ml-8 mt-1 space-y-1 animate-fadeInSlideDown">
                  <button
                    onClick={() => {
                      router.push('/admin/users');
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List Users
                  </button>
                  <button
                    onClick={() => {
                      // Dispatch event to open modal from anywhere
                      const event = new CustomEvent('openCreateUserModal');
                      window.dispatchEvent(event);
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create User
                  </button>
                </div>
              )}
            </div>
            
            {/* Domains with Dropdown */}
            <div className="w-full">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'domains' ? null : 'domains')}
                className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  activeTab.startsWith('domains')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center">
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Domains
                </div>
                <svg className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'domains' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'domains' && (
                <div className="ml-8 mt-1 space-y-1 animate-fadeInSlideDown">
                  <button
                    onClick={() => {
                      router.push('/admin/domains');
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List Domains
                  </button>
                  <button
                    onClick={() => {
                      // Dispatch event to open modal from anywhere
                      const event = new CustomEvent('openCreateDomainModal');
                      window.dispatchEvent(event);
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Domain
                  </button>
                </div>
              )}
            </div>
            
            {/* Classifications with Dropdown */}
            <div className="w-full">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'classifications' ? null : 'classifications')}
                className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  activeTab.startsWith('classifications')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center">
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Classifications
                </div>
                <svg className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'classifications' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'classifications' && (
                <div className="ml-8 mt-1 space-y-1 animate-fadeInSlideDown">
                  <button
                    onClick={() => {
                      router.push('/admin/classifications');
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List Classifications
                  </button>
                  <button
                    onClick={() => {
                      // Dispatch event to open modal from anywhere
                      const event = new CustomEvent('openCreateClassificationModal');
                      window.dispatchEvent(event);
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Classification
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => router.push('/admin/emails')}
              className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'emails'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Emails
            </button>
            
            <button
              onClick={() => router.push('/admin/settings')}
              className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Top navbar */}
        <header className="sticky top-0 z-40 bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-3 text-foreground hover:text-primary transition-colors duration-200 lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-foreground animate-fadeInSlideRight">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200"
                />
                <svg className="absolute right-3 top-2.5 h-5 w-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <button className="relative text-foreground hover:text-primary transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive animate-pingOnce"></span>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none group"
                >
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                    <span className="font-semibold text-accent-foreground">
                      {currentUser && currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border border-border animate-fadeInSlideDown">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{currentUser && currentUser.username ? currentUser.username : 'Admin'}</p>
                      <p className="text-xs text-foreground/60 truncate">{currentUser && currentUser.email ? currentUser.email : 'admin@example.com'}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/admin/settings');
                        setUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fadeInZoom">
          <GlobalModals>
            {children}
          </GlobalModals>
        </main>
      </div>
    </div>
  );
}