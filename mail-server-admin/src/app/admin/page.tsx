'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/apiClient';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalEmails: number;
  totalAdmins: number;
  activeAdmins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Admin Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeInSlideUp delay-100">
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border transform hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Total Users</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>12% since last month</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border transform hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Active Users</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.activeUsers || 0}</p>
              </div>
              <div className="p-2.5 bg-green-500/10 rounded-lg">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>8% since last month</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border transform hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Total Emails</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats?.totalEmails || 0}</p>
              </div>
              <div className="p-2.5 bg-purple-500/10 rounded-lg">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>3% since last month</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border transform hover:-translate-y-1">
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
            <div className="mt-3">
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>5% since last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInSlideUp delay-150">
        {/* Traffic Chart */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">Traffic</h2>
            <div className="h-64 flex items-center justify-center bg-accent rounded-lg">
              <p className="text-foreground/70 text-sm">Chart visualization would go here</p>
            </div>
          </div>
        </div>
        
        {/* Revenue Chart */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">Revenue</h2>
            <div className="h-64 flex items-center justify-center bg-accent rounded-lg">
              <p className="text-foreground/70 text-sm">Chart visualization would go here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-200">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-foreground">Projects</h2>
            <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105">
              View Report
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-accent">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Companies</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Members</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Budget</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                        <span className="text-primary text-xs font-medium">XD</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-medium text-foreground">Soft UI XD Version</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex -space-x-1.5">
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">$14,000</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-border rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <div className="ml-2 text-xs font-medium text-foreground">60%</div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-purple-500/10 rounded-md flex items-center justify-center">
                        <span className="text-purple-500 text-xs font-medium">AT</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-medium text-foreground">Add Progress Track</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex -space-x-1.5">
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">$3,000</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-border rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <div className="ml-2 text-xs font-medium text-foreground">10%</div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-green-500/10 rounded-md flex items-center justify-center">
                        <span className="text-green-500 text-xs font-medium">SL</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-medium text-foreground">Fix Platform Errors</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex -space-x-1.5">
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-6 w-6 rounded-full border border-card" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">Not set</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-border rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <div className="ml-2 text-xs font-medium text-foreground">100%</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-200">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-accent">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Activity</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Users Affected</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="text-xs font-medium text-foreground">New user registrations</div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">+{stats?.totalUsers || 0} users</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">Today</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">Completed</span>
                  </td>
                </tr>
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="text-xs font-medium text-foreground">Email delivery</div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">+{stats?.totalEmails || 0} emails</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">Today</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">Completed</span>
                  </td>
                </tr>
                <tr className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="text-xs font-medium text-foreground">System maintenance</div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">All users</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground/70">Yesterday</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}