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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{username: string, email: string, role?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuAnimating, setIsMobileMenuAnimating] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/profile`, {
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
            email: data.admin.email,
            role: data.admin.role
          });
        } else {
          // If data structure is not as expected, redirect to login
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
    if (pathname?.includes('/admin/emails')) {
      setActiveTab('emails');
    } else if (pathname?.includes('/admin/domains')) {
      setActiveTab('domains');
    } else if (pathname?.includes('/admin/classifications')) {
      setActiveTab('classifications');
    } else if (pathname?.includes('/admin/settings')) {
      setActiveTab('settings');
    } else if (pathname?.includes('/admin/admins')) {
      setActiveTab('admins');
    } else if (pathname?.includes('/admin/server-info')) {
      setActiveTab('server-info');
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

  const toggleMobileMenu = () => {
    if (!sidebarOpen) {
      // Opening menu
      setIsMobileMenuAnimating(true);
      setSidebarOpen(true);
    } else {
      // Closing menu
      setIsMobileMenuAnimating(true);
      setTimeout(() => {
        setSidebarOpen(false);
        setIsMobileMenuAnimating(false);
      }, 300); // Match the duration of the CSS transition
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile menu button */}
      <div className="md:hidden bg-card border-b border-foreground/10 p-4 flex items-center justify-between">
        <button 
          onClick={toggleMobileMenu}
          className="flex items-center text-foreground hover:text-primary transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none group"
          >
            <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center transition-all duration-200 group-hover:scale-110">
              <span className="font-semibold text-background">
                {currentUser && currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-foreground/10 flex flex-col transition-all duration-300 ease-in-out shadow-lg rounded-r-xl transform
          ${sidebarOpen 
            ? 'w-64 fixed inset-y-0 z-30 md:relative translate-x-0' 
            : 'hidden md:flex md:w-64 -translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-5 border-b border-foreground/10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Admin<span className="text-primary">Panel</span>
            </h1>
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden text-foreground hover:text-primary transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          
          {/* Navigation Menu */}
          <nav className="mb-6">
            <ul className="space-y-2">
              {/* Dashboard */}
              <li>
                <button
                  onClick={() => {
                    router.push('/admin');
                    if (window.innerWidth < 768) toggleMobileMenu();
                  }}
                  className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
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
              </li>
              
              {/* Emails with Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'emails' ? null : 'emails')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
                    activeTab.startsWith('emails')
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Emails
                  </div>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'emails' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openDropdown === 'emails' && (
                  <div className="ml-8 mt-1 space-y-1 animate-fadeInSlideDown">
                    <button
                      onClick={() => {
                        router.push('/admin/emails');
                        setOpenDropdown(null);
                        if (window.innerWidth < 768) toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      List Emails
                    </button>
                    <button
                      onClick={() => {
                        // Dispatch event to open modal from anywhere
                        const event = new CustomEvent('openCreateEmailModal');
                        window.dispatchEvent(event);
                        setOpenDropdown(null);
                        if (window.innerWidth < 768) toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Email
                    </button>
                  </div>
                )}
              </div>
              
              {/* Domains with Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'domains' ? null : 'domains')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
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
                        if (window.innerWidth < 768) toggleMobileMenu();
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
                        if (window.innerWidth < 768) toggleMobileMenu();
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
                  className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
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
                        if (window.innerWidth < 768) toggleMobileMenu();
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
                        if (window.innerWidth < 768) toggleMobileMenu();
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
              
              {/* Emails with Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'emails' ? null : 'emails')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
                    activeTab.startsWith('emails')
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Emails
                  </div>
                  <svg className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'emails' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openDropdown === 'emails' && (
                  <div className="ml-8 mt-1 space-y-1 animate-fadeInSlideDown">
                    <button
                      onClick={() => {
                        router.push('/admin/emails');
                        setOpenDropdown(null);
                        if (window.innerWidth < 768) toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      List Emails
                    </button>
                    <button
                      onClick={() => {
                        // Dispatch event to open modal from anywhere
                        const event = new CustomEvent('openCreateEmailModal');
                        window.dispatchEvent(event);
                        setOpenDropdown(null);
                        if (window.innerWidth < 768) toggleMobileMenu();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Email
                    </button>
                  </div>
                )}
              </div>
          
              <li>
                <button
                  onClick={() => {
                    router.push('/admin/settings');
                    if (window.innerWidth < 768) toggleMobileMenu();
                  }}
                  className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
                    activeTab === 'settings'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </li>
              
              <li>
                <button
                  onClick={() => {
                    router.push('/admin/admins');
                    if (window.innerWidth < 768) toggleMobileMenu();
                  }}
                  className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
                    activeTab === 'admins'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Admins
                </button>
              </li>
              
              {currentUser?.role === 'superadmin' && (
                <li>
                  <button
                    onClick={() => {
                      router.push('/admin/server-info');
                      if (window.innerWidth < 768) toggleMobileMenu();
                    }}
                    className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] transform ${
                      activeTab === 'server-info'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    Server Info
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
        
        <div className="p-4 border-t border-foreground/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center animate-bounceIn transition-transform duration-300 hover:scale-110">
                <span className="text-lg font-bold text-background">
                  {currentUser && currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-semibold text-foreground">{currentUser && currentUser.username ? currentUser.username : 'Admin'}</div>
                <div className="text-xs text-foreground/70 truncate max-w-[120px]">{currentUser && currentUser.email ? currentUser.email : 'admin@example.com'}</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                router.push('/admin/settings');
                if (window.innerWidth < 768) toggleMobileMenu();
                setUserMenuOpen(false);
              }}
              className="text-sm text-foreground hover:text-primary transition-colors duration-300 flex items-center group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:rotate-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-foreground hover:text-primary transition-colors duration-300 flex items-center group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:rotate-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {sidebarOpen && (
        <div 
          className={`md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 ${isMobileMenuAnimating ? 'opacity-100' : 'opacity-0'}`}
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <div className="flex-1 overflow-hidden">
          <div className="p-6 animate-fadeInZoom">
            <GlobalModals>
              {children}
            </GlobalModals>
          </div>
        </div>
      </main>
    </div>
  );
}