'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';

// Helper function to safely call addToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (typeof (window as any).addToast === 'function') {
    (window as any).addToast(message, type);
  } else {
    // Fallback to console logging
    if (type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
};

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  domain?: string;
  isDefaultDomain?: boolean;
  accountClassification?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const router = useRouter();

  // Fetch admin profile
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-auth/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setCurrentUser(data.admin);
      setProfileForm({
        username: data.admin.username,
        email: data.admin.email
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-auth/profile`, profileForm);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Use toast notification instead of inline message
      showToast('Profile updated successfully', 'success');
      setCurrentUser(data.admin);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (passwordForm.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-auth/profile/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Use toast notification instead of inline message
      showToast('Password changed successfully', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
      console.error(err);
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
      <div className="animate-fadeInSlideDown">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-foreground/70">Manage your admin profile and security settings</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fadeInSlideUp delay-100">
        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Password
            </button>
          </nav>
        </div>

        <div className="p-5">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-foreground/70 text-sm">Update your personal information</p>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-200 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-200 text-sm"
                    required
                  />
                </div>
                
                <div className="pt-3">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Change Password</h2>
                <p className="text-foreground/70 text-sm">Update your password to keep your account secure</p>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-200 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-200 text-sm"
                    required
                  />
                  <p className="text-xs text-foreground/70 mt-1">Must be at least 6 characters long</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-200 text-sm"
                    required
                  />
                </div>
                
                <div className="pt-3">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}