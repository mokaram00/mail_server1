'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/apiClient';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  activeAdmins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{username: string, email: string, role?: string} | null>(null);
  const router = useRouter();

  // Get current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/profile`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.admin) {
            setCurrentUser({
              username: data.admin.username,
              email: data.admin.email,
              role: data.admin.role
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    
    fetchUserInfo();
  }, []);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError('Failed to load stats');
      console.error(err);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInSlideDown">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-foreground/70">Welcome to your admin dashboard</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push('/admin/settings')}
            className="px-4 py-2 bg-card border border-foreground/20 rounded-lg hover:bg-muted transition-all duration-200 text-foreground transform hover:scale-105 shadow-sm"
          >
            Admin Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeInSlideUp delay-100">
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1 rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Total Emails</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1 rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Active Emails</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.activeUsers || 0}</p>
              </div>
              <div className="p-2.5 bg-green-500/10 rounded-lg">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1 rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Total Admins</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.totalAdmins || 0}</p>
              </div>
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1 rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Server Status</p>
                <p className="text-2xl font-bold mt-1 text-foreground">Operational</p>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6 animate-fadeInSlideUp delay-200">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/admin/emails')}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Manage Emails</h3>
            <p className="text-sm text-foreground/70 mt-1">View and edit email accounts</p>
          </button>
          
          <button 
            onClick={() => router.push('/admin/domains')}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Manage Domains</h3>
            <p className="text-sm text-foreground/70 mt-1">Configure email domains</p>
          </button>
          
          <button 
            onClick={() => {
              const event = new CustomEvent('openCreateEmailModal');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Create Email</h3>
            <p className="text-sm text-foreground/70 mt-1">Add new email account</p>
          </button>
          
          {/* Products Button */}
          <button 
            onClick={() => router.push('/admin/products')}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Create Product</h3>
            <p className="text-sm text-foreground/70 mt-1">Add new products</p>
          </button>
          
          {/* Coupons Button */}
          <button 
            onClick={() => router.push('/admin/coupons')}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Create Coupon</h3>
            <p className="text-sm text-foreground/70 mt-1">Add new coupons</p>
          </button>
          
          {/* Server Info Button - Will be hidden by layout for non-superadmins */}
          <button 
            onClick={() => router.push('/admin/server-info')}
            className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 group"
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Server Info</h3>
            <p className="text-sm text-foreground/70 mt-1">View server resource usage</p>
          </button>
        </div>
      </div>
    </div>
  );
}